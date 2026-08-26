import { i as createServerFn } from "./ssr2.mjs";
import { B as persistPgliteNow, D as getSql, F as minutesBetween, G as todayIso, L as newId, M as listEmployees, R as num, V as requireProfile, W as settleMinutes, Y as writeAudit, g as discrepancyKind, k as hoursFromEntries, m as assertManager, p as assertLicensed, x as evaluateClaim } from "./session.server-BThkfVCN.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as shopMiddleware } from "./shop-middleware-By_PdWYR.mjs";
import { a as loadEntries, c as mapEntry, d as recordTicketPin, f as resolveGpsStatus, i as liveBoard, l as metersToFeet, n as haversineMeters, o as loadTicketById, r as hydrateToday, s as loadTickets, u as recordGps } from "./queries.server-CkA3omDT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-IGgkW2PG.js
function expectedOk(kind, status) {
	if (kind === "work" || kind === "show") return status === "ON_SITE" || status === "WORKING";
	if (kind === "travel") return status === "APPROACHING" || status === "OFF_SITE" || status === "LEFT_SITE";
	if (kind === "office" || kind === "admin") return status === "AT_OFFICE";
	return true;
}
async function settlePendingGps(opts) {
	const sql = await getSql();
	await sql.query("alter table time_entries add column if not exists gps_confirm_until timestamptz");
	await sql.query("alter table time_entries add column if not exists gps_confirm_status text");
	await sql.query(`create table if not exists shop_alerts (
    id text primary key,
    company_id text not null,
    employee_id text,
    kind text not null,
    title text not null,
    body text not null,
    created_at timestamptz not null default now(),
    read_at timestamptz
  )`);
	const rows = await sql.query(`select id, kind, ticket_id, gps_confirm_until::text, gps_confirm_status
     from time_entries
     where employee_id = $1 and clock_out is null and coalesce(gps_confirm_status, 'pending') = 'pending'`, [opts.employeeId]);
	const now = Date.now();
	const confirmMin = Math.max(1, opts.settings.gpsConfirmMin ?? 15);
	for (const row of rows) {
		const ticket = row.ticket_id ? await loadTicketById(row.ticket_id, opts.settings.gpsRadiusFt) : null;
		const hasFix = opts.lat != null && opts.lng != null;
		const distanceFt = hasFix && ticket?.lat != null && ticket.lng != null ? metersToFeet(haversineMeters(opts.lat, opts.lng, ticket.lat, ticket.lng)) : null;
		const officeFt = hasFix ? metersToFeet(haversineMeters(opts.lat, opts.lng, opts.settings.officeLat, opts.settings.officeLng)) : null;
		const status = resolveGpsStatus({
			hasFix,
			distanceFt,
			radiusFt: ticket?.gpsRadiusFt ?? opts.settings.gpsRadiusFt,
			approachingMultiplier: opts.settings.approachingMultiplier,
			clockedIn: row.kind === "work" || row.kind === "show",
			officeDistanceFt: officeFt,
			officeRadiusFt: opts.settings.officeRadiusFt,
			accuracyM: opts.accuracy
		});
		const deadline = row.gps_confirm_until ? Date.parse(row.gps_confirm_until) : now + confirmMin * 6e4;
		if (hasFix && expectedOk(row.kind, status)) {
			await sql`
        update time_entries
        set gps_confirm_status = 'confirmed',
            gps_backed = true,
            gps_status = ${status},
            updated_at = now()
        where id = ${row.id}
      `;
			continue;
		}
		if (now > deadline) {
			await sql`
        update time_entries
        set gps_confirm_status = 'failed',
            gps_backed = false,
            approval_status = 'pending',
            updated_at = now()
        where id = ${row.id}
      `;
			const cond = opts.settings.payConditions?.[row.kind];
			if (row.kind === "work" ? opts.settings.gpsFailFlagsWork !== false && (cond?.flagOnFail ?? true) : Boolean(cond?.flagOnFail)) {
				if (!(await sql`
          select id from exceptions
          where time_entry_id = ${row.id} and kind = 'gps_mismatch' and status = 'open' limit 1
        `)[0]) {
					await sql`
            insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
            values (
              ${newId("ex")}, ${opts.companyId}, ${opts.employeeId}, ${row.ticket_id}, ${row.id},
              'gps_mismatch', 'warning',
              ${`GPS did not confirm ${row.kind} within ${confirmMin} min. Weekly timecard needs approval.`},
              'open'
            )
          `;
					await sql`
            insert into shop_alerts (id, company_id, employee_id, kind, title, body)
            values (
              ${newId("al")}, ${opts.companyId}, ${opts.employeeId}, 'gps',
              'GPS did not confirm',
              ${`A ${row.kind} punch was not GPS-backed in ${confirmMin} minutes.`}
            )
          `;
				}
			}
		}
	}
}
async function ready(userId) {
	const profile = await requireProfile(userId);
	await hydrateToday(profile.employee.companyId);
	return profile;
}
async function readyLive(userId) {
	const profile = await ready(userId);
	assertLicensed(profile);
	return profile;
}
var getSessionProfile_createServerFn_handler = createServerRpc({
	id: "c3d525e043d6b61c0bf50a82a3a69ad7548fd6a88c52449214c683573a1694f5",
	name: "getSessionProfile",
	filename: "src/lib/field/api.ts"
}, (opts) => getSessionProfile.__executeServer(opts));
var getSessionProfile = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(getSessionProfile_createServerFn_handler, async ({ context }) => ready(context.userId));
var getLiveBoard_createServerFn_handler = createServerRpc({
	id: "62fee2aeb2864ddc063a080a1b0c3d52b4ac6a742bc571e63ed84a2f310c401e",
	name: "getLiveBoard",
	filename: "src/lib/field/api.ts"
}, (opts) => getLiveBoard.__executeServer(opts));
var getLiveBoard = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(getLiveBoard_createServerFn_handler, async ({ context }) => {
	const profile = await readyLive(context.userId);
	assertManager(profile);
	return {
		profile,
		rows: await liveBoard(profile.employee.companyId, profile.settings),
		openExceptions: (await (await getSql())`
      select count(*)::int as c from exceptions
      where company_id = ${profile.employee.companyId} and status = 'open'
    `)[0]?.c ?? 0,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
});
var getFieldToday_createServerFn_handler = createServerRpc({
	id: "c6ba80b8a1d3cb8b95daabef258d15f26693bbef0351d946784529860114452b",
	name: "getFieldToday",
	filename: "src/lib/field/api.ts"
}, (opts) => getFieldToday.__executeServer(opts));
var getFieldToday = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(getFieldToday_createServerFn_handler, async ({ context }) => {
	const profile = await readyLive(context.userId);
	await settlePendingGps({
		companyId: profile.employee.companyId,
		employeeId: profile.employee.id,
		settings: profile.settings
	});
	const asTechId = profile.employee.role === "technician" ? profile.employee.id : void 0;
	const settings = profile.settings;
	const tickets = (await loadTickets(profile.employee.companyId, settings.gpsRadiusFt, asTechId)).filter((t) => t.status !== "complete");
	const today = todayIso(settings.timezone);
	const entries = await loadEntries({
		companyId: profile.employee.companyId,
		employeeId: profile.employee.role === "technician" ? profile.employee.id : profile.employee.id,
		fromIso: `${today}T00:00:00-04:00`,
		toIso: `${today}T23:59:59-04:00`
	});
	const hours = hoursFromEntries(entries);
	const open = entries.find((e) => !e.clockOut) ?? null;
	return {
		profile,
		tickets,
		entries,
		hours,
		open,
		currentTicket: open?.ticketId ? tickets.find((t) => t.id === open.ticketId) ?? null : tickets.find((t) => t.status === "in_progress" || t.status === "scheduled") ?? null,
		exceptions: await (await getSql())`
      select id, kind, message, status, created_at from exceptions
      where employee_id = ${profile.employee.id} and created_at::date = ${today}::date
      order by created_at desc
    `,
		trackingActive: Boolean(open) || !settings.trackingOnlyDuringWork
	};
});
var listJobs_createServerFn_handler = createServerRpc({
	id: "ca9ee1ce288c1279c5bac6b92ed4ddb082c52a67da24e1090359774b89df24c3",
	name: "listJobs",
	filename: "src/lib/field/api.ts"
}, (opts) => listJobs.__executeServer(opts));
var listJobs = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(listJobs_createServerFn_handler, async ({ context }) => {
	const profile = await readyLive(context.userId);
	const techId = profile.employee.role === "technician" ? profile.employee.id : void 0;
	return {
		profile,
		tickets: await loadTickets(profile.employee.companyId, profile.settings.gpsRadiusFt, techId)
	};
});
var getJob_createServerFn_handler = createServerRpc({
	id: "21205be9b1be19a8cb2b5ee5e1e30d0868c99dfcf3032a96c261bca4d778a518",
	name: "getJob",
	filename: "src/lib/field/api.ts"
}, (opts) => getJob.__executeServer(opts));
var getJob = createServerFn({ method: "GET" }).validator((ticketId) => ticketId).middleware([shopMiddleware]).handler(getJob_createServerFn_handler, async ({ context, data: ticketId }) => {
	const profile = await readyLive(context.userId);
	const ticket = await loadTicketById(ticketId, profile.settings.gpsRadiusFt);
	if (!ticket) throw new Error("Ticket not found");
	if (profile.employee.role === "technician" && ticket.technicianId !== profile.employee.id) throw Object.assign(/* @__PURE__ */ new Error("Not assigned to this ticket"), { status: 403 });
	const sql = await getSql();
	const entries = await sql.query(`select te.*, t.ticket_number from time_entries te
       left join tickets t on t.id = te.ticket_id
       where te.ticket_id = $1 order by te.clock_in`, [ticketId]);
	const parts = await sql`
      select tp.id, p.part_number, p.manufacturer, p.description, tp.quantity, tp.unit_price
      from ticket_parts tp join parts p on p.id = tp.part_id
      where tp.ticket_id = ${ticketId}
    `;
	const exceptions = await sql`
      select id, kind, severity, message, status, created_at from exceptions
      where ticket_id = ${ticketId} order by created_at desc
    `;
	let receipts = [];
	try {
		receipts = await sql`
        select id, code, amount, vendor, notes, created_at
        from job_receipts where ticket_id = ${ticketId} order by created_at desc
      `;
	} catch {
		receipts = [];
	}
	return {
		profile,
		ticket,
		entries: entries.map(mapEntry),
		parts: parts.map((p) => ({
			...p,
			unit_price: num(p.unit_price)
		})),
		exceptions,
		receipts: receipts.map((r) => ({
			id: r.id,
			ticketId,
			employeeId: "",
			code: r.code,
			amount: num(r.amount),
			vendor: r.vendor,
			notes: r.notes,
			createdAt: r.created_at
		}))
	};
});
function distanceFor(ticket, lat, lng) {
	if (!ticket || ticket.lat == null || ticket.lng == null) return null;
	return metersToFeet(haversineMeters(lat, lng, ticket.lat, ticket.lng));
}
function officeDistance(settings, lat, lng) {
	return metersToFeet(haversineMeters(lat, lng, settings.officeLat, settings.officeLng));
}
function statusAt(opts) {
	const hasFix = opts.lat != null && opts.lng != null && !(opts.lat === 0 && opts.lng === 0);
	const distanceFt = hasFix ? distanceFor(opts.ticket, opts.lat, opts.lng) : null;
	const officeFt = hasFix ? officeDistance(opts.settings, opts.lat, opts.lng) : null;
	return {
		status: resolveGpsStatus({
			hasFix,
			distanceFt,
			radiusFt: opts.ticket?.gpsRadiusFt ?? opts.settings.gpsRadiusFt,
			approachingMultiplier: opts.settings.approachingMultiplier,
			clockedIn: opts.clockedIn,
			previouslyOnSite: opts.previouslyOnSite,
			officeDistanceFt: officeFt,
			officeRadiusFt: opts.settings.officeRadiusFt,
			accuracyM: opts.accuracy
		}),
		distanceFt,
		officeFt,
		hasFix
	};
}
var pingGps_createServerFn_handler = createServerRpc({
	id: "ce2efa6d87b2adccd171e5811a11375e2439af92dbea4bc0bfb22dbaef4b5d48",
	name: "pingGps",
	filename: "src/lib/field/api.ts"
}, (opts) => pingGps.__executeServer(opts));
var pingGps = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(pingGps_createServerFn_handler, async ({ context, data }) => {
	const profile = await readyLive(context.userId);
	const sql = await getSql();
	const ticket = data.ticketId ? await loadTicketById(data.ticketId, profile.settings.gpsRadiusFt) : null;
	const open = await sql.query(`select te.*, t.ticket_number from time_entries te
       left join tickets t on t.id = te.ticket_id
       where te.employee_id = $1 and te.clock_out is null
       order by te.clock_in desc limit 1`, [profile.employee.id]);
	const clockedIn = Boolean(open[0] && (open[0].kind === "work" || open[0].kind === "show" || open[0].kind === "travel" || open[0].kind === "office"));
	const last = await sql`
      select status from gps_events where employee_id = ${profile.employee.id}
      order by recorded_at desc limit 1
    `;
	const { status, distanceFt, officeFt } = statusAt({
		settings: profile.settings,
		ticket,
		lat: data.lat,
		lng: data.lng,
		clockedIn,
		previouslyOnSite: last[0]?.status === "WORKING" || last[0]?.status === "ON_SITE",
		accuracy: data.accuracy
	});
	await sql`
      insert into gps_events (
        id, company_id, employee_id, ticket_id, lat, lng, accuracy, distance_ft, status
      ) values (
        ${newId("gps")}, ${profile.employee.companyId}, ${profile.employee.id},
        ${data.ticketId ?? open[0]?.ticket_id ?? null}, ${data.lat ?? null}, ${data.lng ?? null},
        ${data.accuracy ?? null}, ${distanceFt}, ${status}
      )
    `;
	if (data.lat != null && data.lng != null) await recordGps({
		employeeId: profile.employee.id,
		lat: data.lat,
		lng: data.lng,
		accuracy: data.accuracy ?? null,
		ticketId: data.ticketId ?? open[0]?.ticket_id ?? null,
		status,
		distanceFt,
		at: (/* @__PURE__ */ new Date()).toISOString()
	});
	await settlePendingGps({
		companyId: profile.employee.companyId,
		employeeId: profile.employee.id,
		settings: profile.settings,
		lat: data.lat,
		lng: data.lng,
		accuracy: data.accuracy
	});
	if (status === "LEFT_SITE" && ticket) {
		if (!(await sql`
        select id from exceptions
        where employee_id = ${profile.employee.id} and ticket_id = ${ticket.id}
          and kind = 'left_site' and status = 'open' limit 1
      `)[0]) await sql`
          insert into exceptions (id, company_id, employee_id, ticket_id, kind, severity, message, status)
          values (
            ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket.id},
            'left_site', 'warning',
            ${`Device is ${Math.round(distanceFt ?? 0)} ft from job-site radius (${ticket.gpsRadiusFt} ft).`},
            'open'
          )
        `;
	}
	await persistPgliteNow();
	return {
		status,
		distanceFt,
		officeFt,
		trackingActive: true
	};
});
var clockIn_createServerFn_handler = createServerRpc({
	id: "3d2862191d396d332e0240acd582f7dea9eccdf092126cae67e33fb9ee2a1adc",
	name: "clockIn",
	filename: "src/lib/field/api.ts"
}, (opts) => clockIn.__executeServer(opts));
var clockIn = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(clockIn_createServerFn_handler, async ({ context, data }) => {
	const profile = await readyLive(context.userId);
	const sql = await getSql();
	const kind = data.kind ?? "work";
	const ticket = data.ticketId ? await loadTicketById(data.ticketId, profile.settings.gpsRadiusFt) : null;
	if (!ticket && kind !== "office" && kind !== "break" && kind !== "admin") throw new Error("Pick a job before starting drive, show, or work.");
	if ((await sql`
      select id from time_entries where employee_id = ${profile.employee.id} and clock_out is null
    `)[0]) throw new Error("Already clocked in. Clock out or switch status first.");
	const { status, distanceFt } = statusAt({
		settings: profile.settings,
		ticket,
		lat: data.lat,
		lng: data.lng,
		clockedIn: kind === "work" || kind === "show",
		accuracy: data.accuracy
	});
	const claim = evaluateClaim({
		kind,
		gpsStatus: status,
		settings: profile.settings
	});
	const id = newId("te");
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await sql`
      insert into time_entries (
        id, company_id, employee_id, ticket_id, kind, clock_in,
        clock_in_lat, clock_in_lng, clock_in_accuracy, clock_in_distance_ft,
        gps_status, gps_backed, original_clock_in, created_by
      ) values (
        ${id}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket?.id ?? null},
        ${kind}, ${now}, ${data.lat}, ${data.lng}, ${data.accuracy ?? null},
        ${distanceFt}, ${status}, ${claim.gpsBacked}, ${now}, ${context.userId}
      )
    `;
	const confirmMin = profile.settings.gpsConfirmMin ?? 15;
	const until = new Date(Date.now() + confirmMin * 6e4).toISOString();
	await sql.query("alter table time_entries add column if not exists gps_confirm_until timestamptz");
	await sql.query("alter table time_entries add column if not exists gps_confirm_status text");
	await sql`
      update time_entries
      set gps_confirm_until = ${until},
          gps_confirm_status = ${claim.gpsBacked ? "confirmed" : "pending"}
      where id = ${id}
    `;
	if (ticket) await sql`update tickets set status = 'in_progress', updated_at = now() where id = ${ticket.id}`;
	await sql`
      insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, distance_ft, status)
      values (${newId("gps")}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket?.id ?? null},
        ${data.lat ?? null}, ${data.lng ?? null}, ${data.accuracy ?? null}, ${distanceFt}, ${status})
    `;
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "clock_in",
		entityType: "time_entry",
		entityId: id,
		ticketId: ticket?.id ?? null,
		newValue: {
			at: now,
			kind,
			gpsStatus: status,
			distanceFt,
			gpsBacked: claim.gpsBacked,
			confirmMin
		}
	});
	await persistPgliteNow();
	return {
		id,
		status,
		distanceFt,
		gpsBacked: claim.gpsBacked,
		reason: claim.reason,
		confirmMin
	};
});
var clockOut_createServerFn_handler = createServerRpc({
	id: "93de9bb59259f2c41992208449ed5eb1be3e02a7c52c31a2e8dd761dc27c266f",
	name: "clockOut",
	filename: "src/lib/field/api.ts"
}, (opts) => clockOut.__executeServer(opts));
var clockOut = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(clockOut_createServerFn_handler, async ({ context, data }) => {
	const profile = await readyLive(context.userId);
	const sql = await getSql();
	await settlePendingGps({
		companyId: profile.employee.companyId,
		employeeId: profile.employee.id,
		settings: profile.settings,
		lat: data.lat,
		lng: data.lng,
		accuracy: data.accuracy
	});
	const open = await sql.query(`select te.*, t.ticket_number from time_entries te
       left join tickets t on t.id = te.ticket_id
       where te.employee_id = $1 and te.clock_out is null
       order by te.clock_in desc limit 1`, [profile.employee.id]);
	if (!open[0]) throw new Error("Not currently clocked in.");
	const entry = open[0];
	const ticket = entry.ticket_id ? await loadTicketById(entry.ticket_id, profile.settings.gpsRadiusFt) : null;
	const { status, distanceFt } = statusAt({
		settings: profile.settings,
		ticket,
		lat: data.lat,
		lng: data.lng,
		clockedIn: false,
		previouslyOnSite: true,
		accuracy: data.accuracy
	});
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const total = minutesBetween(entry.clock_in, now);
	const claim = evaluateClaim({
		kind: entry.kind,
		gpsStatus: status,
		settings: profile.settings
	});
	const settled = settleMinutes(total, claim);
	let paid = settled.paid;
	let billable = settled.billable;
	if (profile.settings.paySoldHours && ticket && (entry.kind === "work" || entry.kind === "show") && (claim.gpsBacked || entry.kind === "work")) {
		const soldMin = ticket.expectedHours * 60;
		if (soldMin > paid) {
			paid = soldMin;
			billable = soldMin;
		}
	}
	await sql`
      update time_entries set
        clock_out = ${now},
        clock_out_lat = ${data.lat},
        clock_out_lng = ${data.lng},
        clock_out_accuracy = ${data.accuracy ?? null},
        clock_out_distance_ft = ${distanceFt},
        billable_minutes = ${billable},
        non_billable_minutes = ${settled.nonBillable},
        paid_minutes = ${paid},
        unpaid_minutes = ${Math.max(0, total - paid)},
        gps_backed = ${claim.gpsBacked},
        gps_status = ${status},
        original_clock_out = coalesce(original_clock_out, ${now}),
        updated_at = now(),
        updated_by = ${context.userId}
      where id = ${entry.id}
    `;
	if (ticket && !profile.settings.paySoldHours) {
		const onSiteHrs = (entry.kind === "work" || entry.kind === "show" ? paid : 0) / 60;
		const kind = discrepancyKind(onSiteHrs, ticket.expectedHours, profile.settings.exceptionToleranceMin, ticket.codes.length > 0);
		if (kind) {
			const msg = kind === "under_billed" ? `On-site ${onSiteHrs.toFixed(2)}h vs invoice codes ${ticket.expectedHours.toFixed(2)}h on #${ticket.ticketNumber}.` : kind === "over_billed" ? `Invoice codes ${ticket.expectedHours.toFixed(2)}h vs on-site ${onSiteHrs.toFixed(2)}h on #${ticket.ticketNumber}.` : "On-site time recorded with no labor code on the ticket.";
			await sql`
          insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
          values (
            ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket.id}, ${entry.id},
            ${kind}, 'warning', ${msg}, 'open'
          )
        `;
		}
	}
	if (!claim.paid && settled.unpaid > 1 && claim.reason) await sql`
        insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
        values (
          ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${entry.ticket_id}, ${entry.id},
          'unpaid_claim', 'warning', ${claim.reason}, 'open'
        )
      `;
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "clock_out",
		entityType: "time_entry",
		entityId: entry.id,
		ticketId: entry.ticket_id,
		newValue: {
			at: now,
			minutes: Math.round(total),
			paid,
			unpaid: Math.max(0, total - paid),
			status
		}
	});
	await persistPgliteNow();
	return {
		minutes: total,
		paid,
		unpaid: Math.max(0, total - paid),
		status,
		distanceFt,
		gpsBacked: claim.gpsBacked
	};
});
var transitionClock_createServerFn_handler = createServerRpc({
	id: "f96102af49c440d93707d503656f9bbeab9154d126816192d3181952c420e913",
	name: "transitionClock",
	filename: "src/lib/field/api.ts"
}, (opts) => transitionClock.__executeServer(opts));
var transitionClock = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(transitionClock_createServerFn_handler, async ({ context, data }) => {
	const profile = await readyLive(context.userId);
	if ((await (await getSql())`
      select id from time_entries where employee_id = ${profile.employee.id} and clock_out is null
    `)[0]) await clockOut({ data: { ...data } });
	return clockIn({ data });
});
var submitNote_createServerFn_handler = createServerRpc({
	id: "6449f0984301b58d559512761a0ce5d8c9540d7fb1eefb26e9e240da90ebe86b",
	name: "submitNote",
	filename: "src/lib/field/api.ts"
}, (opts) => submitNote.__executeServer(opts));
var submitNote = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(submitNote_createServerFn_handler, async ({ context, data }) => {
	const profile = await readyLive(context.userId);
	const message = data.message.trim();
	if (!message) throw new Error("Note cannot be empty");
	await (await getSql())`
      insert into exceptions (id, company_id, employee_id, ticket_id, kind, severity, message, status)
      values (
        ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.ticketId ?? null},
        'note', 'info', ${message}, 'open'
      )
    `;
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "submit_note",
		entityType: "exception",
		ticketId: data.ticketId,
		newValue: { message }
	});
	return { ok: true };
});
var setJobSiteToHere_createServerFn_handler = createServerRpc({
	id: "4e8808c3c2610a4fd119cf4fcfef8537efe974b8e49065909744693dfda458f2",
	name: "setJobSiteToHere",
	filename: "src/lib/field/api.ts"
}, (opts) => setJobSiteToHere.__executeServer(opts));
var setJobSiteToHere = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(setJobSiteToHere_createServerFn_handler, async ({ context, data }) => {
	const profile = await readyLive(context.userId);
	const sql = await getSql();
	const techId = (await sql`
      select technician_id from tickets where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `)[0]?.technician_id;
	if (profile.employee.role === "technician" && techId && techId !== profile.employee.id) throw Object.assign(/* @__PURE__ */ new Error("This job is not assigned to you"), { status: 403 });
	await sql`
      update tickets set lat = ${data.lat}, lng = ${data.lng}, updated_at = now(), updated_by = ${context.userId}
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
	await recordTicketPin(data.ticketId, data.lat, data.lng);
	await persistPgliteNow();
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "set_job_gps",
		entityType: "ticket",
		entityId: data.ticketId,
		ticketId: data.ticketId,
		newValue: {
			lat: data.lat,
			lng: data.lng
		},
		reason: "Admin set job-site coordinates from current device location"
	});
	return { ok: true };
});
var listPeople_createServerFn_handler = createServerRpc({
	id: "25a1be0e9153568fb1c96f600a9ca88bac71a41fe19404b2118888bb21ffb44b",
	name: "listPeople",
	filename: "src/lib/field/api.ts"
}, (opts) => listPeople.__executeServer(opts));
var listPeople = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(listPeople_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	assertManager(profile);
	const { collapseShopPeople } = await import("./shop-session.server-CMUhym2s.mjs");
	await collapseShopPeople(profile.employee.companyId);
	return {
		profile,
		people: (await listEmployees(profile.employee.companyId)).filter((p) => p.accountStatus !== "disabled")
	};
});
//#endregion
export { clockIn_createServerFn_handler, clockOut_createServerFn_handler, getFieldToday_createServerFn_handler, getJob_createServerFn_handler, getLiveBoard_createServerFn_handler, getSessionProfile_createServerFn_handler, listJobs_createServerFn_handler, listPeople_createServerFn_handler, pingGps_createServerFn_handler, setJobSiteToHere_createServerFn_handler, submitNote_createServerFn_handler, transitionClock_createServerFn_handler };
