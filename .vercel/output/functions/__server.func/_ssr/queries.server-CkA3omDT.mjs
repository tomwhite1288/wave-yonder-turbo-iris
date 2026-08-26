import { B as persistPgliteNow, D as getSql, F as minutesBetween, P as mapEmployee, R as num, i as EMP_SELECT, k as hoursFromEntries } from "./session.server-BThkfVCN.mjs";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/queries.server-CkA3omDT.js
/** One-time: stop generating demo tickets. Never wipe live punches, flags, or jobs. */
async function hydrateToday(companyId) {
	const sql = await getSql();
	if ((await sql`
    select value from settings where company_id = ${companyId} and key = 'hydrated_day'
  `)[0]?.value === "off") return;
	await sql`delete from code_book where company_id = ${companyId} and id like 'cb_%'`;
	await sql`
    insert into settings (company_id, key, value, updated_at)
    values (${companyId}, 'hydrated_day', 'off', now())
    on conflict (company_id, key) do update set value = 'off', updated_at = now()
  `;
}
var EARTH_M = 6371e3;
function haversineMeters(lat1, lng1, lat2, lng2) {
	const toRad = (d) => d * Math.PI / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(a)));
}
function metersToFeet(m) {
	return m * 3.28084;
}
function effectiveRadiusFt(radiusFt, accuracyM) {
	return radiusFt + metersToFeet(Math.max(0, accuracyM ?? 0));
}
function resolveGpsStatus(opts) {
	if (!opts.hasFix) return "OFFLINE";
	const officeRadius = effectiveRadiusFt(opts.officeRadiusFt ?? 200, opts.accuracyM);
	if (opts.officeDistanceFt != null && opts.officeDistanceFt <= officeRadius) return "AT_OFFICE";
	if (opts.distanceFt == null) return "OFF_SITE";
	const radius = effectiveRadiusFt(opts.radiusFt, opts.accuracyM);
	const approach = radius * opts.approachingMultiplier;
	if (opts.clockedIn && opts.distanceFt <= radius) return "WORKING";
	if (opts.previouslyOnSite && opts.distanceFt > radius) return "LEFT_SITE";
	if (opts.distanceFt <= radius) return "ON_SITE";
	if (opts.distanceFt <= approach) return "APPROACHING";
	return "OFF_SITE";
}
var GPS_LABEL = {
	OFF_SITE: "Off site",
	APPROACHING: "In transit",
	ON_SITE: "On site",
	WORKING: "Working",
	LEFT_SITE: "Left site",
	AT_OFFICE: "At office",
	OFFLINE: "Offline"
};
var EMPTY = {
	gps: {},
	ticketPins: {},
	setupComplete: false,
	demoLocked: false,
	activationHash: null
};
var mem = globalThis;
function localPath() {
	return path.join(process.cwd(), "data", "durable.json");
}
async function blobGet() {
	try {
		const { getStore } = await import("../_libs/@netlify/blobs+[...].mjs").then((n) => n.t);
		return await getStore({
			name: "fieldledger-db",
			consistency: "strong"
		}).get("durable.json", { type: "json" }) ?? null;
	} catch {
		return null;
	}
}
async function blobPut(state) {
	try {
		const { getStore } = await import("../_libs/@netlify/blobs+[...].mjs").then((n) => n.t);
		await getStore({
			name: "fieldledger-db",
			consistency: "strong"
		}).setJSON("durable.json", state);
	} catch {}
}
async function fileGet() {
	try {
		const raw = await readFile(localPath(), "utf8");
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
async function filePut(state) {
	try {
		await mkdir(path.dirname(localPath()), { recursive: true });
		await writeFile(localPath(), JSON.stringify(state), "utf8");
	} catch {}
}
async function loadDurable() {
	if (mem.__fieldDurable__) return mem.__fieldDurable__;
	const fromFile = await blobGet() ?? await fileGet();
	mem.__fieldDurable__ = fromFile ? {
		...EMPTY,
		...fromFile,
		gps: fromFile.gps ?? {},
		ticketPins: fromFile.ticketPins ?? {}
	} : {
		...EMPTY,
		gps: {},
		ticketPins: {}
	};
	return mem.__fieldDurable__;
}
async function saveDurable(patch) {
	const current = await loadDurable();
	const next = {
		gps: patch.gps ?? current.gps,
		ticketPins: patch.ticketPins ?? current.ticketPins,
		setupComplete: patch.setupComplete ?? current.setupComplete,
		demoLocked: patch.demoLocked ?? current.demoLocked,
		activationHash: patch.activationHash === void 0 ? current.activationHash : patch.activationHash
	};
	mem.__fieldDurable__ = next;
	await blobPut(next);
	await filePut(next);
	await persistPgliteNow();
	return next;
}
async function recordGps(fix) {
	const current = await loadDurable();
	current.gps[fix.employeeId] = fix;
	await saveDurable({ gps: current.gps });
}
async function recordTicketPin(ticketId, lat, lng) {
	const current = await loadDurable();
	current.ticketPins[ticketId] = {
		lat,
		lng
	};
	await saveDurable({ ticketPins: current.ticketPins });
}
function mapTicket(row, codes, defaultRadius) {
	const attached = codes.filter((c) => c.ticket_id === row.id);
	return {
		id: row.id,
		ticketNumber: row.ticket_number,
		customerName: row.customer_name,
		addressLine: row.address_line,
		city: row.city,
		state: row.state,
		zip: row.zip,
		lat: row.lat == null ? null : num(row.lat),
		lng: row.lng == null ? null : num(row.lng),
		gpsRadiusFt: row.gps_radius_ft == null ? defaultRadius : num(row.gps_radius_ft),
		scheduledStart: row.scheduled_start ? new Date(row.scheduled_start).toISOString() : null,
		scheduledEnd: row.scheduled_end ? new Date(row.scheduled_end).toISOString() : null,
		technicianId: row.technician_id,
		technicianName: row.technician_name,
		invoiceNumber: row.invoice_number,
		invoiceAmount: num(row.invoice_amount),
		laborAmount: num(row.labor_amount),
		partsAmount: num(row.parts_amount),
		status: row.status,
		workDetail: row.work_detail,
		notes: row.notes,
		jobKind: row.job_kind === "callback" || row.job_kind === "warranty" ? row.job_kind : "service",
		codes: attached.map((c) => ({
			code: c.code,
			hoursExpected: num(c.hours_expected),
			laborValue: num(c.labor_value)
		})),
		expectedHours: attached.reduce((s, c) => s + num(c.hours_expected), 0)
	};
}
var TICKET_SELECT = `
  select t.id, t.ticket_number, t.customer_name, t.address_line, t.city, t.state, t.zip,
         t.lat, t.lng, t.gps_radius_ft, t.scheduled_start, t.scheduled_end, t.technician_id,
         trim(coalesce(e.first_name,'') || ' ' || coalesce(e.last_name,'')) as technician_name,
         t.invoice_number, t.invoice_amount, t.labor_amount, t.parts_amount, t.status,
         t.work_detail, t.notes, coalesce(t.job_kind, 'service') as job_kind
  from tickets t
  left join employees e on e.id = t.technician_id
`;
async function loadTickets(companyId, defaultRadius, technicianId) {
	const sql = await getSql();
	await sql.query("alter table tickets add column if not exists job_kind text not null default 'service'");
	const rows = technicianId ? await sql.query(`${TICKET_SELECT} where t.company_id = $1 and t.technician_id = $2 order by t.scheduled_start asc`, [companyId, technicianId]) : await sql.query(`${TICKET_SELECT} where t.company_id = $1 order by t.scheduled_start asc`, [companyId]);
	if (rows.length === 0) return [];
	const ids = rows.map((r) => r.id);
	const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
	const codes = await sql.query(`select ticket_id, code, hours_expected, labor_value from ticket_codes where ticket_id in (${placeholders})`, ids);
	const mapped = rows.map((r) => mapTicket(r, codes, defaultRadius));
	try {
		const durable = await loadDurable();
		for (const t of mapped) {
			const pin = durable.ticketPins[t.id];
			if (pin && (t.lat == null || t.lng == null)) {
				t.lat = pin.lat;
				t.lng = pin.lng;
			}
		}
	} catch {}
	return mapped;
}
async function loadTicketById(id, defaultRadius) {
	const sql = await getSql();
	await sql.query("alter table tickets add column if not exists job_kind text not null default 'service'");
	const rows = await sql.query(`${TICKET_SELECT} where t.id = $1`, [id]);
	if (!rows[0]) return null;
	const codes = await sql.query(`select ticket_id, code, hours_expected, labor_value from ticket_codes where ticket_id = $1`, [id]);
	const ticket = mapTicket(rows[0], codes, defaultRadius);
	try {
		const pin = (await loadDurable()).ticketPins[ticket.id];
		if (pin && (ticket.lat == null || ticket.lng == null)) {
			ticket.lat = pin.lat;
			ticket.lng = pin.lng;
		}
	} catch {}
	return ticket;
}
function mapEntry(row) {
	return {
		id: row.id,
		employeeId: row.employee_id,
		ticketId: row.ticket_id,
		ticketNumber: row.ticket_number,
		kind: row.kind,
		clockIn: row.clock_in,
		clockOut: row.clock_out,
		billableMinutes: num(row.billable_minutes),
		nonBillableMinutes: num(row.non_billable_minutes),
		paidMinutes: num(row.paid_minutes),
		unpaidMinutes: num(row.unpaid_minutes),
		gpsBacked: Boolean(row.gps_backed),
		gpsStatus: row.gps_status,
		clockInDistanceFt: row.clock_in_distance_ft == null ? null : num(row.clock_in_distance_ft),
		notes: row.notes,
		adjusted: row.adjusted,
		adjustmentReason: row.adjustment_reason,
		approvalStatus: row.approval_status,
		originalClockIn: row.original_clock_in,
		originalClockOut: row.original_clock_out,
		gpsConfirmStatus: row.gps_confirm_status ?? null,
		gpsConfirmUntil: row.gps_confirm_until ?? null
	};
}
async function loadEntries(opts) {
	const sql = await getSql();
	return (opts.employeeId ? await sql.query(`select te.*, t.ticket_number
         from time_entries te
         left join tickets t on t.id = te.ticket_id
         where te.company_id = $1 and te.employee_id = $2
           and te.clock_in < $4 and (te.clock_out is null or te.clock_out >= $3)
         order by te.clock_in asc`, [
		opts.companyId,
		opts.employeeId,
		opts.fromIso,
		opts.toIso
	]) : await sql.query(`select te.*, t.ticket_number
         from time_entries te
         left join tickets t on t.id = te.ticket_id
         where te.company_id = $1
           and te.clock_in < $3 and (te.clock_out is null or te.clock_out >= $2)
         order by te.clock_in asc`, [
		opts.companyId,
		opts.fromIso,
		opts.toIso
	])).map(mapEntry);
}
async function liveBoard(companyId, settings) {
	const sql = await getSql();
	const techs = await sql.query(`${EMP_SELECT} where e.company_id = $1 and e.active = true order by e.last_name`, [companyId]);
	const tickets = await loadTickets(companyId, settings.gpsRadiusFt);
	const entries = await loadEntries({
		companyId,
		fromIso: `${(/* @__PURE__ */ new Date()).toLocaleString("en-CA", { timeZone: settings.timezone }).slice(0, 10)}T00:00:00-04:00`,
		toIso: `${(/* @__PURE__ */ new Date()).toLocaleString("en-CA", { timeZone: settings.timezone }).slice(0, 10)}T23:59:59-04:00`
	});
	const exceptions = await sql`
    select employee_id, count(*)::int as c from exceptions
    where company_id = ${companyId} and status = 'open'
    group by employee_id
  `;
	const exMap = new Map(exceptions.map((e) => [e.employee_id, e.c]));
	const gps = await sql`
    select distinct on (employee_id) employee_id, lat, lng, recorded_at, distance_ft, status
    from gps_events
    where company_id = ${companyId}
    order by employee_id, recorded_at desc
  `;
	const gpsMap = new Map(gps.map((g) => [g.employee_id, g]));
	try {
		const durable = await loadDurable();
		for (const fix of Object.values(durable.gps)) {
			const existing = gpsMap.get(fix.employeeId);
			if (!existing || String(fix.at) > String(existing.recorded_at)) gpsMap.set(fix.employeeId, {
				employee_id: fix.employeeId,
				lat: fix.lat,
				lng: fix.lng,
				recorded_at: fix.at,
				distance_ft: fix.distanceFt,
				status: fix.status
			});
		}
	} catch {}
	return techs.map((row) => {
		const employee = mapEmployee(row);
		const mine = entries.filter((e) => e.employeeId === employee.id);
		const open = mine.find((e) => !e.clockOut);
		const hours = hoursFromEntries(mine);
		const ticket = open?.ticketId ? tickets.find((t) => t.id === open.ticketId) ?? null : tickets.filter((t) => t.technicianId === employee.id && t.status !== "complete").sort((a, b) => String(a.scheduledStart ?? "").localeCompare(String(b.scheduledStart ?? "")))[0] ?? tickets.filter((t) => t.technicianId === employee.id).sort((a, b) => String(b.scheduledStart ?? "").localeCompare(String(a.scheduledStart ?? "")))[0] ?? null;
		const last = gpsMap.get(employee.id);
		let distanceFt = last?.distance_ft == null ? null : num(last.distance_ft);
		if (distanceFt == null && last && ticket?.lat != null && ticket.lng != null) distanceFt = metersToFeet(haversineMeters(num(last.lat), num(last.lng), ticket.lat, ticket.lng));
		const officeDistanceFt = last ? metersToFeet(haversineMeters(num(last.lat), num(last.lng), settings.officeLat, settings.officeLng)) : null;
		const clockedIn = Boolean(open && (open.kind === "work" || open.kind === "show"));
		const previouslyOnSite = last?.status === "WORKING" || last?.status === "ON_SITE" || last?.status === "LEFT_SITE";
		const gpsStatus = last ? resolveGpsStatus({
			hasFix: true,
			distanceFt,
			radiusFt: ticket?.gpsRadiusFt ?? settings.gpsRadiusFt,
			approachingMultiplier: settings.approachingMultiplier,
			clockedIn,
			previouslyOnSite,
			officeDistanceFt,
			officeRadiusFt: settings.officeRadiusFt
		}) : "OFFLINE";
		const arrival = open?.clockIn ?? null;
		const durationMin = open ? minutesBetween(open.clockIn, open.clockOut) : hours.worked;
		return {
			employee,
			gpsStatus,
			ticket: ticket ?? null,
			arrival,
			durationMin,
			billableHours: hours.billable / 60,
			nonBillableHours: hours.nonBillable / 60,
			expectedHours: ticket?.expectedHours ?? 0,
			distanceFt,
			lastGpsAt: last?.recorded_at ?? null,
			lastLat: last ? num(last.lat) : null,
			lastLng: last ? num(last.lng) : null,
			openExceptions: exMap.get(employee.id) ?? 0,
			efficiency: hours.billable > 0 ? hours.billable / 60 / 8.5 : null,
			clockedIn
		};
	});
}
//#endregion
export { loadEntries as a, mapEntry as c, recordTicketPin as d, resolveGpsStatus as f, liveBoard as i, metersToFeet as l, haversineMeters as n, loadTicketById as o, hydrateToday as r, loadTickets as s, GPS_LABEL as t, recordGps as u };
