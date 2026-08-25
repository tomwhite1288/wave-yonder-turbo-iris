import { r as createServerFn } from "./ssr.mjs";
import { C as requireProfile, E as writeAudit, S as num, h as getSql, o as assertManager, s as bootstrapProfile, v as listEmployees, w as todayIso, x as newId } from "./session.server-DEz6QvgN.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as authMiddleware } from "./middleware-Db937Ikd.mjs";
import { a as hoursFromEntries, c as loadEntries, d as mapEntry, f as metersToFeet, h as resolveGpsStatus, i as haversineMeters, l as loadTicketById, n as discrepancyKind, o as hydrateToday, p as minutesBetween, s as liveBoard, u as loadTickets } from "./hydrate.server-GLJsv2Jg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-BcJYDvWz.js
async function ready(userId) {
	const u = (await (await getSql()).query(`select id, name, email from "user" where id = $1`, [userId]))[0];
	const profile = await bootstrapProfile({
		userId,
		email: u?.email ?? null,
		name: u?.name ?? null
	});
	await hydrateToday(profile.employee.companyId);
	return profile;
}
var getSessionProfile_createServerFn_handler = createServerRpc({
	id: "c3d525e043d6b61c0bf50a82a3a69ad7548fd6a88c52449214c683573a1694f5",
	name: "getSessionProfile",
	filename: "src/lib/field/api.ts"
}, (opts) => getSessionProfile.__executeServer(opts));
var getSessionProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSessionProfile_createServerFn_handler, async ({ context }) => ready(context.userId));
var getLiveBoard_createServerFn_handler = createServerRpc({
	id: "62fee2aeb2864ddc063a080a1b0c3d52b4ac6a742bc571e63ed84a2f310c401e",
	name: "getLiveBoard",
	filename: "src/lib/field/api.ts"
}, (opts) => getLiveBoard.__executeServer(opts));
var getLiveBoard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getLiveBoard_createServerFn_handler, async ({ context }) => {
	const profile = await ready(context.userId);
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
var getFieldToday = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getFieldToday_createServerFn_handler, async ({ context }) => {
	const profile = await ready(context.userId);
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
var listJobs = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listJobs_createServerFn_handler, async ({ context }) => {
	const profile = await ready(context.userId);
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
var getJob = createServerFn({ method: "GET" }).validator((ticketId) => ticketId).middleware([authMiddleware]).handler(getJob_createServerFn_handler, async ({ context, data: ticketId }) => {
	const profile = await ready(context.userId);
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
	return {
		profile,
		ticket,
		entries: entries.map(mapEntry),
		parts: parts.map((p) => ({
			...p,
			unit_price: num(p.unit_price)
		})),
		exceptions
	};
});
function distanceFor(ticket, lat, lng) {
	if (!ticket || ticket.lat == null || ticket.lng == null) return null;
	return metersToFeet(haversineMeters(lat, lng, ticket.lat, ticket.lng));
}
var pingGps_createServerFn_handler = createServerRpc({
	id: "ce2efa6d87b2adccd171e5811a11375e2439af92dbea4bc0bfb22dbaef4b5d48",
	name: "pingGps",
	filename: "src/lib/field/api.ts"
}, (opts) => pingGps.__executeServer(opts));
var pingGps = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(pingGps_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	const sql = await getSql();
	const ticket = data.ticketId ? await loadTicketById(data.ticketId, profile.settings.gpsRadiusFt) : null;
	const open = await sql.query(`select te.*, t.ticket_number from time_entries te
       left join tickets t on t.id = te.ticket_id
       where te.employee_id = $1 and te.clock_out is null
       order by te.clock_in desc limit 1`, [profile.employee.id]);
	const clockedIn = Boolean(open[0] && open[0].kind === "work");
	const distanceFt = distanceFor(ticket, data.lat, data.lng);
	const last = await sql`
      select status from gps_events where employee_id = ${profile.employee.id}
      order by recorded_at desc limit 1
    `;
	const status = resolveGpsStatus({
		hasFix: true,
		distanceFt,
		radiusFt: ticket?.gpsRadiusFt ?? profile.settings.gpsRadiusFt,
		approachingMultiplier: profile.settings.approachingMultiplier,
		clockedIn,
		previouslyOnSite: last[0]?.status === "WORKING" || last[0]?.status === "ON_SITE"
	});
	await sql`
      insert into gps_events (
        id, company_id, employee_id, ticket_id, lat, lng, accuracy, distance_ft, status
      ) values (
        ${newId("gps")}, ${profile.employee.companyId}, ${profile.employee.id},
        ${data.ticketId ?? open[0]?.ticket_id ?? null}, ${data.lat}, ${data.lng},
        ${data.accuracy ?? null}, ${distanceFt}, ${status}
      )
    `;
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
	return {
		status,
		distanceFt,
		trackingActive: true
	};
});
var clockIn_createServerFn_handler = createServerRpc({
	id: "3d2862191d396d332e0240acd582f7dea9eccdf092126cae67e33fb9ee2a1adc",
	name: "clockIn",
	filename: "src/lib/field/api.ts"
}, (opts) => clockIn.__executeServer(opts));
var clockIn = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(clockIn_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	const sql = await getSql();
	const ticket = await loadTicketById(data.ticketId, profile.settings.gpsRadiusFt);
	if (!ticket) throw new Error("Ticket not found");
	if ((await sql`
      select id from time_entries where employee_id = ${profile.employee.id} and clock_out is null
    `)[0]) throw new Error("Already clocked in. Clock out first.");
	const distanceFt = distanceFor(ticket, data.lat, data.lng);
	const status = resolveGpsStatus({
		hasFix: true,
		distanceFt,
		radiusFt: ticket.gpsRadiusFt,
		approachingMultiplier: profile.settings.approachingMultiplier,
		clockedIn: true
	});
	const id = newId("te");
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await sql`
      insert into time_entries (
        id, company_id, employee_id, ticket_id, kind, clock_in,
        clock_in_lat, clock_in_lng, clock_in_accuracy, clock_in_distance_ft,
        gps_status, original_clock_in, created_by
      ) values (
        ${id}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.ticketId},
        ${data.kind ?? "work"}, ${now}, ${data.lat}, ${data.lng}, ${data.accuracy ?? null},
        ${distanceFt}, ${status}, ${now}, ${context.userId}
      )
    `;
	await sql`update tickets set status = 'in_progress', updated_at = now() where id = ${data.ticketId}`;
	await sql`
      insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, distance_ft, status)
      values (${newId("gps")}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.ticketId},
        ${data.lat}, ${data.lng}, ${data.accuracy ?? null}, ${distanceFt}, ${status})
    `;
	if (distanceFt != null && distanceFt > ticket.gpsRadiusFt) await sql`
        insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
        values (
          ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.ticketId}, ${id},
          'gps_mismatch', 'info',
          ${`Clock-in recorded ${Math.round(distanceFt)} ft from the job site (radius ${ticket.gpsRadiusFt} ft). GPS is evidence, not payroll truth.`},
          'open'
        )
      `;
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "clock_in",
		entityType: "time_entry",
		entityId: id,
		ticketId: data.ticketId,
		newValue: {
			at: now,
			gpsStatus: status,
			distanceFt
		}
	});
	return {
		id,
		status,
		distanceFt
	};
});
var clockOut_createServerFn_handler = createServerRpc({
	id: "93de9bb59259f2c41992208449ed5eb1be3e02a7c52c31a2e8dd761dc27c266f",
	name: "clockOut",
	filename: "src/lib/field/api.ts"
}, (opts) => clockOut.__executeServer(opts));
var clockOut = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(clockOut_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	const sql = await getSql();
	const open = await sql.query(`select te.*, t.ticket_number from time_entries te
       left join tickets t on t.id = te.ticket_id
       where te.employee_id = $1 and te.clock_out is null
       order by te.clock_in desc limit 1`, [profile.employee.id]);
	if (!open[0]) throw new Error("Not currently clocked in.");
	const entry = open[0];
	const ticket = entry.ticket_id ? await loadTicketById(entry.ticket_id, profile.settings.gpsRadiusFt) : null;
	const distanceFt = distanceFor(ticket, data.lat, data.lng);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const total = minutesBetween(entry.clock_in, now);
	const billable = entry.kind === "work" ? total : 0;
	const nonBillable = entry.kind === "work" ? 0 : entry.kind === "break" ? 0 : total;
	const status = resolveGpsStatus({
		hasFix: true,
		distanceFt,
		radiusFt: ticket?.gpsRadiusFt ?? profile.settings.gpsRadiusFt,
		approachingMultiplier: profile.settings.approachingMultiplier,
		clockedIn: false,
		previouslyOnSite: true
	});
	await sql`
      update time_entries set
        clock_out = ${now},
        clock_out_lat = ${data.lat},
        clock_out_lng = ${data.lng},
        clock_out_accuracy = ${data.accuracy ?? null},
        clock_out_distance_ft = ${distanceFt},
        billable_minutes = ${billable},
        non_billable_minutes = ${nonBillable},
        gps_status = ${status},
        original_clock_out = coalesce(original_clock_out, ${now}),
        updated_at = now(),
        updated_by = ${context.userId}
      where id = ${entry.id}
    `;
	if (ticket) {
		const kind = discrepancyKind(billable / 60, ticket.expectedHours, profile.settings.exceptionToleranceMin, ticket.codes.length > 0);
		if (kind) {
			const msg = kind === "under_billed" ? `Technician billable ${(billable / 60).toFixed(2)}h vs invoice codes ${ticket.expectedHours.toFixed(2)}h.` : kind === "over_billed" ? `Invoice codes ${ticket.expectedHours.toFixed(2)}h vs recorded billable ${(billable / 60).toFixed(2)}h.` : "Billable time recorded with no labor code on the invoice.";
			await sql`
          insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
          values (
            ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket.id}, ${entry.id},
            ${kind}, 'warning', ${msg}, 'open'
          )
        `;
		}
	}
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
			distanceFt,
			status
		}
	});
	return {
		minutes: total,
		status,
		distanceFt
	};
});
var submitNote_createServerFn_handler = createServerRpc({
	id: "6449f0984301b58d559512761a0ce5d8c9540d7fb1eefb26e9e240da90ebe86b",
	name: "submitNote",
	filename: "src/lib/field/api.ts"
}, (opts) => submitNote.__executeServer(opts));
var submitNote = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(submitNote_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
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
var setJobSiteToHere = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(setJobSiteToHere_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	assertManager(profile);
	await (await getSql())`
      update tickets set lat = ${data.lat}, lng = ${data.lng}, updated_at = now(), updated_by = ${context.userId}
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
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
var listPeople = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listPeople_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	assertManager(profile);
	return {
		profile,
		people: await listEmployees(profile.employee.companyId)
	};
});
//#endregion
export { clockIn_createServerFn_handler, clockOut_createServerFn_handler, getFieldToday_createServerFn_handler, getJob_createServerFn_handler, getLiveBoard_createServerFn_handler, getSessionProfile_createServerFn_handler, listJobs_createServerFn_handler, listPeople_createServerFn_handler, pingGps_createServerFn_handler, setJobSiteToHere_createServerFn_handler, submitNote_createServerFn_handler };
