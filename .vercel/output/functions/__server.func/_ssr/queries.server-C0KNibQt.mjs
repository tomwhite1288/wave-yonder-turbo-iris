import { E as mapEmployee, b as getSql, k as num, r as EMP_SELECT } from "./session.server-DT32kkW4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/queries.server-C0KNibQt.js
/** Demo tickets are no longer generated. One-time cleanup if an old flag remains. */
async function hydrateToday(companyId) {
	const sql = await getSql();
	if ((await sql`
    select value from settings where company_id = ${companyId} and key = 'hydrated_day'
  `)[0]?.value === "off") return;
	await sql`delete from gps_events where company_id = ${companyId} and (session_id like 'sess_%' or ticket_id like 'tkt_%')`;
	await sql`delete from truck_movements where ticket_id like 'tkt_%'`;
	await sql`delete from exceptions where id like 'ex_%' or ticket_id like 'tkt_%'`;
	await sql`delete from time_entries where id like 'te_%' or ticket_id like 'tkt_%'`;
	await sql`delete from ticket_codes where ticket_id like 'tkt_%'`;
	await sql`delete from ticket_parts where ticket_id like 'tkt_%'`;
	await sql`delete from tickets where id like 'tkt_%'`;
	await sql`delete from code_book where id like 'cb_%'`;
	await sql`
    insert into settings (company_id, key, value, updated_at)
    values (${companyId}, 'hydrated_day', 'off', now())
    on conflict (company_id, key) do update set value = 'off', updated_at = now()
  `;
}
function minutesBetween(startIso, endIso, now = /* @__PURE__ */ new Date()) {
	const start = new Date(startIso).getTime();
	const end = endIso ? new Date(endIso).getTime() : now.getTime();
	return Math.max(0, (end - start) / 6e4);
}
function classifyMinutes(kind, totalMin, billableMin) {
	if (kind === "admin") return {
		billable: 0,
		nonBillable: 0,
		admin: totalMin,
		travel: 0,
		breakMin: 0
	};
	if (kind === "travel") return {
		billable: 0,
		nonBillable: 0,
		admin: 0,
		travel: totalMin,
		breakMin: 0
	};
	if (kind === "break") return {
		billable: 0,
		nonBillable: 0,
		admin: 0,
		travel: 0,
		breakMin: totalMin
	};
	if (kind === "non_billable") return {
		billable: 0,
		nonBillable: totalMin,
		admin: 0,
		travel: 0,
		breakMin: 0
	};
	const billable = Math.min(totalMin, Math.max(0, billableMin || totalMin));
	return {
		billable,
		nonBillable: Math.max(0, totalMin - billable),
		admin: 0,
		travel: 0,
		breakMin: 0
	};
}
function emptyDayHours() {
	return {
		billable: 0,
		nonBillable: 0,
		admin: 0,
		travel: 0,
		breakMin: 0,
		worked: 0
	};
}
function addDayHours(acc, add) {
	return {
		billable: acc.billable + add.billable,
		nonBillable: acc.nonBillable + add.nonBillable,
		admin: acc.admin + add.admin,
		travel: acc.travel + add.travel,
		breakMin: acc.breakMin + add.breakMin,
		worked: acc.worked + add.worked
	};
}
function splitOvertime(workedHours, settings) {
	const daily = settings.overtimeDailyHours;
	if (workedHours <= daily) return {
		regular: workedHours,
		overtime: 0,
		doubleTime: 0
	};
	const extra = workedHours - daily;
	if (settings.doubleTimeEnabled && extra > 4) return {
		regular: daily,
		overtime: 4,
		doubleTime: extra - 4
	};
	return {
		regular: daily,
		overtime: extra,
		doubleTime: 0
	};
}
function payrollForEmployee(opts) {
	const workedHours = opts.hours.worked / 60;
	const split = splitOvertime(workedHours, opts.settings);
	const wage = opts.employee.hourlyWage;
	const grossRegular = split.regular * wage;
	const grossOvertime = split.overtime * wage * opts.settings.overtimeMultiplier + split.doubleTime * wage * 2;
	const totalWages = grossRegular + grossOvertime;
	const totalRevenue = opts.laborRevenue + opts.partsRevenue;
	const billableHours = opts.hours.billable / 60;
	const laborHours = Math.max(workedHours, 1e-4);
	return {
		employee: opts.employee,
		regularHours: split.regular,
		overtimeHours: split.overtime,
		doubleTimeHours: split.doubleTime,
		grossRegular,
		grossOvertime,
		totalWages,
		billableHours,
		nonBillableHours: opts.hours.nonBillable / 60,
		adminHours: opts.hours.admin / 60,
		travelHours: opts.hours.travel / 60,
		laborRevenue: opts.laborRevenue,
		partsRevenue: opts.partsRevenue,
		totalRevenue,
		revenuePerLaborHour: totalRevenue / laborHours,
		laborCostPct: totalRevenue > 0 ? totalWages / totalRevenue : 0,
		contributionAfterLabor: totalRevenue - totalWages
	};
}
function efficiencyForEmployee(opts) {
	const billableHours = opts.hours.billable / 60;
	const fieldHours = (opts.hours.billable + opts.hours.nonBillable + (opts.settings.travelCountsAsField ? opts.hours.travel : 0)) / 60;
	const actualWorked = opts.hours.worked / 60;
	const available = Math.max(opts.availableHours, 0);
	const totalRevenue = opts.laborRevenue + opts.partsRevenue;
	return {
		employee: opts.employee,
		availableHours: available,
		actualWorkedHours: actualWorked,
		billableHours,
		nonBillableHours: opts.hours.nonBillable / 60,
		adminHours: opts.hours.admin / 60,
		travelHours: opts.hours.travel / 60,
		fieldHours,
		billableEfficiency: available > 0 ? billableHours / available : 0,
		fieldUtilization: fieldHours > 0 ? billableHours / fieldHours : 0,
		laborRevenue: opts.laborRevenue,
		partsRevenue: opts.partsRevenue,
		totalRevenue,
		revenuePerBillableHour: billableHours > 0 ? totalRevenue / billableHours : 0,
		revenuePerFieldHour: fieldHours > 0 ? totalRevenue / fieldHours : 0,
		grossContribution: totalRevenue - actualWorked * opts.employee.hourlyWage
	};
}
function discrepancyKind(actualBillableHours, expectedHours, toleranceMin, hasCodes) {
	if (actualBillableHours > .05 && !hasCodes) return "missing_code";
	const deltaMin = (actualBillableHours - expectedHours) * 60;
	if (deltaMin > toleranceMin) return "under_billed";
	if (deltaMin < -toleranceMin && expectedHours > 0) return "over_billed";
	return null;
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
function resolveGpsStatus(opts) {
	if (!opts.hasFix) return "OFFLINE";
	if (opts.distanceFt == null) return "OFF_SITE";
	const approach = opts.radiusFt * opts.approachingMultiplier;
	if (opts.clockedIn && opts.distanceFt <= opts.radiusFt) return "WORKING";
	if (opts.previouslyOnSite && opts.distanceFt > opts.radiusFt) return "LEFT_SITE";
	if (opts.distanceFt <= opts.radiusFt) return "ON_SITE";
	if (opts.distanceFt <= approach) return "APPROACHING";
	return "OFF_SITE";
}
var GPS_LABEL = {
	OFF_SITE: "Off site",
	APPROACHING: "Approaching",
	ON_SITE: "On site",
	WORKING: "Working",
	LEFT_SITE: "Left site",
	OFFLINE: "Offline"
};
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
         t.work_detail, t.notes
  from tickets t
  left join employees e on e.id = t.technician_id
`;
async function loadTickets(companyId, defaultRadius, technicianId) {
	const sql = await getSql();
	const rows = technicianId ? await sql.query(`${TICKET_SELECT} where t.company_id = $1 and t.technician_id = $2 order by t.scheduled_start asc`, [companyId, technicianId]) : await sql.query(`${TICKET_SELECT} where t.company_id = $1 order by t.scheduled_start asc`, [companyId]);
	if (rows.length === 0) return [];
	const ids = rows.map((r) => r.id);
	const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
	const codes = await sql.query(`select ticket_id, code, hours_expected, labor_value from ticket_codes where ticket_id in (${placeholders})`, ids);
	return rows.map((r) => mapTicket(r, codes, defaultRadius));
}
async function loadTicketById(id, defaultRadius) {
	const sql = await getSql();
	const rows = await sql.query(`${TICKET_SELECT} where t.id = $1`, [id]);
	if (!rows[0]) return null;
	const codes = await sql.query(`select ticket_id, code, hours_expected, labor_value from ticket_codes where ticket_id = $1`, [id]);
	return mapTicket(rows[0], codes, defaultRadius);
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
		gpsStatus: row.gps_status,
		clockInDistanceFt: row.clock_in_distance_ft == null ? null : num(row.clock_in_distance_ft),
		notes: row.notes,
		adjusted: row.adjusted,
		adjustmentReason: row.adjustment_reason,
		approvalStatus: row.approval_status,
		originalClockIn: row.original_clock_in,
		originalClockOut: row.original_clock_out
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
function hoursFromEntries(entries, now = /* @__PURE__ */ new Date()) {
	return entries.reduce((acc, entry) => {
		const total = minutesBetween(entry.clockIn, entry.clockOut, now);
		const split = classifyMinutes(entry.kind, total, entry.billableMinutes || (entry.kind === "work" ? total : 0));
		const worked = entry.kind === "break" ? 0 : total;
		return addDayHours(acc, {
			billable: split.billable,
			nonBillable: split.nonBillable,
			admin: split.admin,
			travel: split.travel,
			breakMin: split.breakMin,
			worked
		});
	}, emptyDayHours());
}
async function liveBoard(companyId, settings) {
	const sql = await getSql();
	const techs = await sql.query(`${EMP_SELECT} where e.company_id = $1 and e.role = 'technician' and e.active = true order by e.last_name`, [companyId]);
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
	return techs.map((row) => {
		const employee = mapEmployee(row);
		const mine = entries.filter((e) => e.employeeId === employee.id);
		const open = mine.find((e) => !e.clockOut);
		const hours = hoursFromEntries(mine);
		const ticket = open?.ticketId ? tickets.find((t) => t.id === open.ticketId) ?? null : tickets.filter((t) => t.technicianId === employee.id && t.status !== "complete").sort((a, b) => String(a.scheduledStart ?? "").localeCompare(String(b.scheduledStart ?? "")))[0] ?? tickets.filter((t) => t.technicianId === employee.id).sort((a, b) => String(b.scheduledStart ?? "").localeCompare(String(a.scheduledStart ?? "")))[0] ?? null;
		const last = gpsMap.get(employee.id);
		let distanceFt = last?.distance_ft == null ? null : num(last.distance_ft);
		if (distanceFt == null && last && ticket?.lat != null && ticket.lng != null) distanceFt = metersToFeet(haversineMeters(num(last.lat), num(last.lng), ticket.lat, ticket.lng));
		const clockedIn = Boolean(open && open.kind === "work");
		const previouslyOnSite = last?.status === "WORKING" || last?.status === "ON_SITE" || last?.status === "LEFT_SITE";
		const gpsStatus = last ? resolveGpsStatus({
			hasFix: true,
			distanceFt,
			radiusFt: ticket?.gpsRadiusFt ?? settings.gpsRadiusFt,
			approachingMultiplier: settings.approachingMultiplier,
			clockedIn,
			previouslyOnSite
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
export { hoursFromEntries as a, loadEntries as c, mapEntry as d, metersToFeet as f, resolveGpsStatus as h, haversineMeters as i, loadTicketById as l, payrollForEmployee as m, discrepancyKind as n, hydrateToday as o, minutesBetween as p, efficiencyForEmployee as r, liveBoard as s, GPS_LABEL as t, loadTickets as u };
