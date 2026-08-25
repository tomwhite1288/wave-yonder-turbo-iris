import { E as writeAudit, S as num, b as mapEmployee, h as getSql, n as EMP_SELECT, w as todayIso, x as newId } from "./session.server-DEz6QvgN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/hydrate.server-GLJsv2Jg.js
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
         t.invoice_number, t.invoice_amount, t.labor_amount, t.parts_amount, t.status
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
			openExceptions: exMap.get(employee.id) ?? 0,
			efficiency: hours.billable > 0 ? hours.billable / 60 / 8.5 : null,
			clockedIn
		};
	});
}
function stamp(dateIso, time) {
	return `${dateIso}T${time}-04:00`;
}
function addDays(dateIso, days) {
	const d = /* @__PURE__ */ new Date(`${dateIso}T12:00:00-04:00`);
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}
async function hydrateToday(companyId) {
	const sql = await getSql();
	const today = todayIso("America/New_York");
	if ((await sql`
    select value from settings where company_id = ${companyId} and key = 'hydrated_day'
  `)[0]?.value === `${today}:v2`) return;
	await sql`delete from gps_events where company_id = ${companyId} and (session_id like 'sess_%' or ticket_id like 'tkt_%')`;
	await sql`delete from truck_movements where ticket_id like 'tkt_%'`;
	await sql`delete from exceptions where id in ('ex_elena_under', 'ex_derrick_left', 'ex_y_ot') or ticket_id like 'tkt_%'`;
	await sql`delete from time_entries where id like 'te_%' or ticket_id like 'tkt_%'`;
	await sql`delete from ticket_codes where ticket_id like 'tkt_%'`;
	await sql`delete from ticket_parts where ticket_id like 'tkt_%'`;
	await sql`delete from tickets where id like 'tkt_%'`;
	const yesterday = addDays(today, -1);
	const jobs = [
		{
			id: "tkt_123456",
			number: "123456",
			customer: "Harrington Residence",
			address: "1201 N Market St",
			city: "Wilmington",
			state: "DE",
			zip: "19801",
			lat: 39.748,
			lng: -75.547,
			start: stamp(today, "08:00:00"),
			end: stamp(today, "11:00:00"),
			tech: "emp_john",
			invoice: "INV-88421",
			amount: 647.5,
			labor: 462.5,
			parts: 185,
			status: "in_progress",
			codes: ["B", "C"]
		},
		{
			id: "tkt_123457",
			number: "123457",
			customer: "Oak Lane Dental",
			address: "42 E Main St",
			city: "Newark",
			state: "DE",
			zip: "19711",
			lat: 39.6837,
			lng: -75.7499,
			start: stamp(today, "10:00:00"),
			end: stamp(today, "12:30:00"),
			tech: "emp_marcus",
			invoice: "INV-88422",
			amount: 370,
			labor: 370,
			parts: 0,
			status: "scheduled",
			codes: ["PM2", "A"]
		},
		{
			id: "tkt_123458",
			number: "123458",
			customer: "Riverfront Lofts #4B",
			address: "500 Delaware Ave",
			city: "Wilmington",
			state: "DE",
			zip: "19801",
			lat: 39.7485,
			lng: -75.551,
			start: stamp(today, "07:30:00"),
			end: stamp(today, "10:00:00"),
			tech: "emp_elena",
			invoice: "INV-88423",
			amount: 185,
			labor: 185,
			parts: 0,
			status: "in_progress",
			codes: ["A"]
		},
		{
			id: "tkt_123459",
			number: "123459",
			customer: "New Castle Public Library",
			address: "424 Delaware St",
			city: "New Castle",
			state: "DE",
			zip: "19720",
			lat: 39.6598,
			lng: -75.5664,
			start: stamp(today, "07:00:00"),
			end: stamp(today, "09:30:00"),
			tech: "emp_derrick",
			invoice: "INV-88424",
			amount: 555,
			labor: 370,
			parts: 185,
			status: "complete",
			codes: ["CAP", "C"]
		},
		{
			id: "tkt_123460",
			number: "123460",
			customer: "Christiana Commons",
			address: "15 S DuPont Hwy",
			city: "New Castle",
			state: "DE",
			zip: "19720",
			lat: 39.668,
			lng: -75.5675,
			start: stamp(today, "13:00:00"),
			end: stamp(today, "16:00:00"),
			tech: "emp_john",
			invoice: "",
			amount: 0,
			labor: 0,
			parts: 0,
			status: "scheduled",
			codes: ["TOI", "FAU"]
		},
		{
			id: "tkt_y_john",
			number: "123401",
			customer: "Brandywine School District",
			address: "1311 Brandywine Blvd",
			city: "Wilmington",
			state: "DE",
			zip: "19809",
			lat: 39.769,
			lng: -75.529,
			start: stamp(yesterday, "08:00:00"),
			end: stamp(yesterday, "12:00:00"),
			tech: "emp_john",
			invoice: "INV-88390",
			amount: 740,
			labor: 555,
			parts: 185,
			status: "complete",
			codes: ["E"]
		},
		{
			id: "tkt_y_marcus",
			number: "123402",
			customer: "Pike Creek Medical",
			address: "3105 Limestone Rd",
			city: "Wilmington",
			state: "DE",
			zip: "19808",
			lat: 39.735,
			lng: -75.696,
			start: stamp(yesterday, "08:30:00"),
			end: stamp(yesterday, "11:30:00"),
			tech: "emp_marcus",
			invoice: "INV-88391",
			amount: 429,
			labor: 370,
			parts: 59,
			status: "complete",
			codes: ["BRD"]
		},
		{
			id: "tkt_y_elena",
			number: "123403",
			customer: "The Mill Apartments",
			address: "200 S Dupont St",
			city: "Wilmington",
			state: "DE",
			zip: "19805",
			lat: 39.732,
			lng: -75.568,
			start: stamp(yesterday, "07:45:00"),
			end: stamp(yesterday, "15:30:00"),
			tech: "emp_elena",
			invoice: "INV-88392",
			amount: 1649,
			labor: 740,
			parts: 909,
			status: "complete",
			codes: ["WH-R"]
		},
		{
			id: "tkt_y_derrick",
			number: "123404",
			customer: "Fox Run HOA Clubhouse",
			address: "101 Fox Run Blvd",
			city: "Bear",
			state: "DE",
			zip: "19701",
			lat: 39.629,
			lng: -75.658,
			start: stamp(yesterday, "07:15:00"),
			end: stamp(yesterday, "16:40:00"),
			tech: "emp_derrick",
			invoice: "INV-88393",
			amount: 980,
			labor: 740,
			parts: 240,
			status: "complete",
			codes: ["E", "THM"]
		}
	];
	const codes = await sql`
    select code, hours, labor_value from code_book where company_id = ${companyId}
  `;
	const codeMap = new Map(codes.map((c) => [c.code, c]));
	for (const job of jobs) {
		await sql`
      insert into tickets (
        id, company_id, ticket_number, customer_name, address_line, city, state, zip,
        lat, lng, scheduled_start, scheduled_end, technician_id, invoice_number,
        invoice_amount, labor_amount, parts_amount, status, source
      ) values (
        ${job.id}, ${companyId}, ${job.number}, ${job.customer}, ${job.address},
        ${job.city}, ${job.state}, ${job.zip}, ${job.lat}, ${job.lng},
        ${job.start}, ${job.end}, ${job.tech}, ${job.invoice || null},
        ${job.amount}, ${job.labor}, ${job.parts}, ${job.status}, 'seed'
      )
    `;
		for (const code of job.codes) {
			const def = codeMap.get(code);
			await sql`
        insert into ticket_codes (id, ticket_id, code, hours_expected, labor_value)
        values (
          ${newId("tc")}, ${job.id}, ${code},
          ${def?.hours ?? 1}, ${def?.labor_value ?? 185}
        )
      `;
		}
	}
	await sql`
    insert into ticket_parts (id, ticket_id, part_id, quantity, unit_cost, unit_price)
    values
      (${newId("tp")}, 'tkt_123456', 'pt_moen_1225', 1, 12.40, 28.95),
      (${newId("tp")}, 'tkt_123456', 'pt_fluid_400a', 1, 7.10, 18.95),
      (${newId("tp")}, 'tkt_123459', 'pt_ge_cap45', 1, 14.80, 42.00),
      (${newId("tp")}, 'tkt_y_elena', 'pt_ao_pro40', 1, 780.00, 1649.00)
  `;
	await sql`
    insert into time_entries (
      id, company_id, employee_id, ticket_id, kind, clock_in, clock_in_lat, clock_in_lng,
      clock_in_accuracy, clock_in_distance_ft, billable_minutes, gps_status,
      original_clock_in, approval_status, created_by
    ) values (
      'te_john_now', ${companyId}, 'emp_john', 'tkt_123456', 'work',
      ${stamp(today, "08:14:00")}, 39.74805, -75.5469, 12, 28, 0, 'WORKING',
      ${stamp(today, "08:14:00")}, 'pending', 'system'
    )
  `;
	await sql`
    insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, recorded_at, distance_ft, status, session_id)
    values
      (${newId("gps")}, ${companyId}, 'emp_john', 'tkt_123456', 39.74805, -75.5469, 12, ${stamp(today, "08:14:00")}, 28, 'WORKING', 'sess_john'),
      (${newId("gps")}, ${companyId}, 'emp_john', 'tkt_123456', 39.74802, -75.54705, 9, now(), 22, 'WORKING', 'sess_john')
  `;
	await sql`
    insert into time_entries (
      id, company_id, employee_id, ticket_id, kind, clock_in, clock_out,
      clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng,
      clock_in_distance_ft, clock_out_distance_ft, billable_minutes, non_billable_minutes,
      gps_status, original_clock_in, original_clock_out, approval_status, created_by
    ) values (
      'te_marcus_travel', ${companyId}, 'emp_marcus', 'tkt_123457', 'travel',
      ${stamp(today, "09:22:00")}, null,
      39.72, -75.64, null, null,
      8200, null, 0, 0, 'APPROACHING',
      ${stamp(today, "09:22:00")}, null, 'pending', 'system'
    )
  `;
	await sql`
    insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, recorded_at, distance_ft, status, session_id)
    values (${newId("gps")}, ${companyId}, 'emp_marcus', 'tkt_123457', 39.6849, -75.7495, 18, now(), 420, 'APPROACHING', 'sess_marcus')
  `;
	await sql`
    insert into time_entries (
      id, company_id, employee_id, ticket_id, kind, clock_in,
      clock_in_lat, clock_in_lng, clock_in_accuracy, clock_in_distance_ft,
      billable_minutes, gps_status, original_clock_in, approval_status, created_by
    ) values (
      'te_elena_now', ${companyId}, 'emp_elena', 'tkt_123458', 'work',
      ${stamp(today, "07:41:00")}, 39.74848, -75.55105, 8, 19, 0, 'WORKING',
      ${stamp(today, "07:41:00")}, 'pending', 'system'
    )
  `;
	await sql`
    insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, recorded_at, distance_ft, status, session_id)
    values (${newId("gps")}, ${companyId}, 'emp_elena', 'tkt_123458', 39.74848, -75.55105, 8, now(), 19, 'WORKING', 'sess_elena')
  `;
	await sql`
    insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
    values (
      'ex_elena_under', ${companyId}, 'emp_elena', 'tkt_123458', 'te_elena_now',
      'under_billed', 'warning',
      'Invoice codes represent 1.0 hour. Technician billable time already exceeds the ±15 minute tolerance.',
      'open'
    )
  `;
	await sql`
    insert into time_entries (
      id, company_id, employee_id, ticket_id, kind, clock_in, clock_out,
      clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng,
      clock_in_distance_ft, clock_out_distance_ft, billable_minutes, non_billable_minutes,
      gps_status, original_clock_in, original_clock_out, approval_status, created_by
    ) values (
      'te_derrick_am', ${companyId}, 'emp_derrick', 'tkt_123459', 'work',
      ${stamp(today, "07:08:00")}, ${stamp(today, "09:44:00")},
      39.6599, -75.5663, 39.671, -75.58,
      42, 623, 148, 8, 'LEFT_SITE',
      ${stamp(today, "07:08:00")}, ${stamp(today, "09:44:00")}, 'pending', 'system'
    )
  `;
	await sql`
    insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, recorded_at, distance_ft, status, session_id)
    values
      (${newId("gps")}, ${companyId}, 'emp_derrick', 'tkt_123459', 39.6599, -75.5663, 10, ${stamp(today, "07:08:00")}, 42, 'WORKING', 'sess_derrick'),
      (${newId("gps")}, ${companyId}, 'emp_derrick', 'tkt_123459', 39.671, -75.58, 16, ${stamp(today, "09:44:00")}, 623, 'LEFT_SITE', 'sess_derrick'),
      (${newId("gps")}, ${companyId}, 'emp_derrick', null, 39.68, -75.59, 20, now(), null, 'OFF_SITE', 'sess_derrick')
  `;
	await sql`
    insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
    values (
      'ex_derrick_left', ${companyId}, 'emp_derrick', 'tkt_123459', 'te_derrick_am',
      'left_site', 'info',
      'Device moved 623 ft from the job-site radius at 9:44 AM after clock-out.',
      'open'
    )
  `;
	const yJobs = [
		{
			id: "te_y_john",
			tech: "emp_john",
			ticket: "tkt_y_john",
			in: stamp(yesterday, "07:52:00"),
			out: stamp(yesterday, "16:18:00"),
			bill: 390,
			nb: 42
		},
		{
			id: "te_y_marcus",
			tech: "emp_marcus",
			ticket: "tkt_y_marcus",
			in: stamp(yesterday, "07:48:00"),
			out: stamp(yesterday, "16:05:00"),
			bill: 360,
			nb: 55
		},
		{
			id: "te_y_elena",
			tech: "emp_elena",
			ticket: "tkt_y_elena",
			in: stamp(yesterday, "07:33:00"),
			out: stamp(yesterday, "16:41:00"),
			bill: 420,
			nb: 38
		},
		{
			id: "te_y_derrick",
			tech: "emp_derrick",
			ticket: "tkt_y_derrick",
			in: stamp(yesterday, "07:18:00"),
			out: stamp(yesterday, "16:37:00"),
			bill: 465,
			nb: 22
		}
	];
	for (const y of yJobs) {
		await sql`
      insert into time_entries (
        id, company_id, employee_id, ticket_id, kind, clock_in, clock_out,
        billable_minutes, non_billable_minutes, gps_status,
        original_clock_in, original_clock_out, approval_status, approved_by, approved_at, created_by
      ) values (
        ${y.id}, ${companyId}, ${y.tech}, ${y.ticket}, 'work', ${y.in}, ${y.out},
        ${y.bill}, ${y.nb}, 'ON_SITE', ${y.in}, ${y.out}, 'approved', 'emp_sarah', ${stamp(yesterday, "17:10:00")}, 'system'
      )
    `;
		await sql`
      insert into timecards (id, company_id, employee_id, work_date, status, approved_by, approved_at, manager_note)
      values (${newId("tc")}, ${companyId}, ${y.tech}, ${yesterday}::date, 'approved', 'emp_sarah', ${stamp(yesterday, "17:10:00")}, 'Closed from field board')
      on conflict do nothing
    `;
	}
	await sql`
    insert into exceptions (id, company_id, employee_id, ticket_id, kind, severity, message, status)
    values (
      'ex_y_ot', ${companyId}, 'emp_derrick', 'tkt_y_derrick', 'overtime', 'info',
      'Yesterday actual (9.3h) exceeded scheduled 8.0h. Overtime will apply at 1.5x.',
      'acknowledged'
    )
  `;
	await writeAudit({
		companyId,
		actorName: "System",
		action: "hydrate_day",
		entityType: "tickets",
		newValue: {
			day: today,
			jobs: jobs.length
		},
		reason: "Seeded live companion data for the current workday"
	});
	await sql`
    insert into settings (company_id, key, value, updated_at)
    values (${companyId}, 'hydrated_day', ${`${today}:v2`}, now())
    on conflict (company_id, key) do update set value = excluded.value, updated_at = now()
  `;
}
//#endregion
export { hoursFromEntries as a, loadEntries as c, mapEntry as d, metersToFeet as f, resolveGpsStatus as h, haversineMeters as i, loadTicketById as l, payrollForEmployee as m, discrepancyKind as n, hydrateToday as o, minutesBetween as p, efficiencyForEmployee as r, liveBoard as s, GPS_LABEL as t, loadTickets as u };
