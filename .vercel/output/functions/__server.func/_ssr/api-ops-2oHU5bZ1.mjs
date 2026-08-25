import { r as createServerFn } from "./ssr.mjs";
import { C as requireProfile, E as writeAudit, S as num, a as assertAdmin, h as getSql, o as assertManager, v as listEmployees, w as todayIso, x as newId } from "./session.server-DEz6QvgN.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as authMiddleware } from "./middleware-Db937Ikd.mjs";
import { a as hoursFromEntries, c as loadEntries, m as payrollForEmployee, o as hydrateToday, r as efficiencyForEmployee } from "./hydrate.server-GLJsv2Jg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-ops-2oHU5bZ1.js
async function mgr(userId) {
	const profile = await requireProfile(userId);
	await hydrateToday(profile.employee.companyId);
	assertManager(profile);
	return profile;
}
function weekRange(timezone) {
	const today = todayIso(timezone);
	const d = /* @__PURE__ */ new Date(`${today}T12:00:00-04:00`);
	const day = d.getDay();
	const mondayOffset = day === 0 ? -6 : 1 - day;
	const monday = new Date(d);
	monday.setDate(d.getDate() + mondayOffset);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	const iso = (x) => x.toISOString().slice(0, 10);
	return {
		from: iso(monday),
		to: iso(sunday),
		today
	};
}
var listTimecards_createServerFn_handler = createServerRpc({
	id: "560810467f473d691fb067993069b4005a50a6d027fb11e208f1cf5bf16c885d",
	name: "listTimecards",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => listTimecards.__executeServer(opts));
var listTimecards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listTimecards_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	await hydrateToday(profile.employee.companyId);
	const { from, to } = weekRange(profile.settings.timezone);
	const techId = profile.employee.role === "technician" ? profile.employee.id : void 0;
	const entries = await loadEntries({
		companyId: profile.employee.companyId,
		employeeId: techId,
		fromIso: `${from}T00:00:00-04:00`,
		toIso: `${to}T23:59:59-04:00`
	});
	const sql = await getSql();
	return {
		profile,
		entries,
		cards: techId ? await sql`
          select id, employee_id, work_date::text, status, manager_note from timecards
          where company_id = ${profile.employee.companyId} and employee_id = ${techId}
            and work_date between ${from}::date and ${to}::date
        ` : await sql`
          select id, employee_id, work_date::text, status, manager_note from timecards
          where company_id = ${profile.employee.companyId}
            and work_date between ${from}::date and ${to}::date
        `,
		people: await listEmployees(profile.employee.companyId, true),
		from,
		to
	};
});
var adjustEntry_createServerFn_handler = createServerRpc({
	id: "184389976b0ce472901a7a4ccab022bba41b0621787ee1ff9617d4d194719ae9",
	name: "adjustEntry",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => adjustEntry.__executeServer(opts));
var adjustEntry = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(adjustEntry_createServerFn_handler, async ({ context, data }) => {
	const profile = await mgr(context.userId);
	if (!data.reason.trim()) throw new Error("Adjustment reason is required");
	const sql = await getSql();
	const row = (await sql`
      select id, clock_in, clock_out, original_clock_in, original_clock_out, ticket_id
      from time_entries where id = ${data.entryId} and company_id = ${profile.employee.companyId}
    `)[0];
	if (!row) throw new Error("Time entry not found");
	await sql`
      update time_entries set
        original_clock_in = coalesce(original_clock_in, clock_in),
        original_clock_out = coalesce(original_clock_out, clock_out),
        clock_in = ${data.clockIn},
        clock_out = ${data.clockOut},
        adjusted = true,
        adjustment_reason = ${data.reason.trim()},
        updated_at = now(),
        updated_by = ${context.userId}
      where id = ${data.entryId}
    `;
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "adjust_time",
		entityType: "time_entry",
		entityId: data.entryId,
		ticketId: row.ticket_id,
		originalValue: {
			clockIn: row.clock_in,
			clockOut: row.clock_out
		},
		newValue: {
			clockIn: data.clockIn,
			clockOut: data.clockOut
		},
		reason: data.reason
	});
	return { ok: true };
});
var approveTimecard_createServerFn_handler = createServerRpc({
	id: "9b32f60b2ff20b9b3b71c111419ac34e416840cb36cea3d214655b72e7731fec",
	name: "approveTimecard",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => approveTimecard.__executeServer(opts));
var approveTimecard = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(approveTimecard_createServerFn_handler, async ({ context, data }) => {
	const profile = await mgr(context.userId);
	const sql = await getSql();
	const existing = await sql`
      select id from timecards where employee_id = ${data.employeeId} and work_date = ${data.workDate}::date
    `;
	if (existing[0]) await sql`
        update timecards set status = 'approved', approved_by = ${profile.employee.id},
          approved_at = now(), manager_note = ${data.note ?? null}, updated_at = now()
        where id = ${existing[0].id}
      `;
	else await sql`
        insert into timecards (id, company_id, employee_id, work_date, status, approved_by, approved_at, manager_note)
        values (${newId("tc")}, ${profile.employee.companyId}, ${data.employeeId}, ${data.workDate}::date,
          'approved', ${profile.employee.id}, now(), ${data.note ?? null})
      `;
	await sql`
      update time_entries set approval_status = 'approved', approved_by = ${profile.employee.id}, approved_at = now()
      where employee_id = ${data.employeeId}
        and clock_in::date = ${data.workDate}::date
        and company_id = ${profile.employee.companyId}
    `;
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "approve_timecard",
		entityType: "timecard",
		entityId: data.employeeId,
		newValue: { workDate: data.workDate },
		reason: data.note
	});
	return { ok: true };
});
var listExceptions_createServerFn_handler = createServerRpc({
	id: "1c1a30c9bdb9be3ccc201cea2f36d3708c9575dc71a20aaff06fffb4df40f6a6",
	name: "listExceptions",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => listExceptions.__executeServer(opts));
var listExceptions = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listExceptions_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	await hydrateToday(profile.employee.companyId);
	const sql = await getSql();
	const techFilter = profile.employee.role === "technician" ? profile.employee.id : null;
	return {
		profile,
		items: (techFilter ? await sql`
          select x.id, x.employee_id, e.first_name, e.last_name, x.ticket_id, t.ticket_number,
                 x.kind, x.severity, x.message, x.status, x.created_at
          from exceptions x
          join employees e on e.id = x.employee_id
          left join tickets t on t.id = x.ticket_id
          where x.company_id = ${profile.employee.companyId} and x.employee_id = ${techFilter}
          order by x.created_at desc
          limit 200
        ` : await sql`
          select x.id, x.employee_id, e.first_name, e.last_name, x.ticket_id, t.ticket_number,
                 x.kind, x.severity, x.message, x.status, x.created_at
          from exceptions x
          join employees e on e.id = x.employee_id
          left join tickets t on t.id = x.ticket_id
          where x.company_id = ${profile.employee.companyId}
          order by x.created_at desc
          limit 200
        `).map((r) => ({
			id: r.id,
			employeeId: r.employee_id,
			employeeName: `${r.first_name} ${r.last_name}`,
			ticketId: r.ticket_id,
			ticketNumber: r.ticket_number,
			kind: r.kind,
			severity: r.severity,
			message: r.message,
			status: r.status,
			createdAt: r.created_at
		}))
	};
});
var resolveException_createServerFn_handler = createServerRpc({
	id: "e3fd0dfced984b8d01dffe0025fc7fb7657f6463534d337747cbd68d196a7e53",
	name: "resolveException",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => resolveException.__executeServer(opts));
var resolveException = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(resolveException_createServerFn_handler, async ({ context, data }) => {
	const profile = await mgr(context.userId);
	await (await getSql())`
      update exceptions set status = ${data.status}, resolved_by = ${profile.employee.id}, resolved_at = now()
      where id = ${data.id} and company_id = ${profile.employee.companyId}
    `;
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "resolve_exception",
		entityType: "exception",
		entityId: data.id,
		newValue: { status: data.status }
	});
	return { ok: true };
});
var getPayroll_createServerFn_handler = createServerRpc({
	id: "79bbec6755a276eee7d668dc588b6b3204f22551bd73b3dee9d8516cdcd49513",
	name: "getPayroll",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => getPayroll.__executeServer(opts));
var getPayroll = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getPayroll_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	await hydrateToday(profile.employee.companyId);
	if (profile.employee.role === "technician") throw Object.assign(/* @__PURE__ */ new Error("Manager access required"), { status: 403 });
	const { from, to } = weekRange(profile.settings.timezone);
	const people = (await listEmployees(profile.employee.companyId, true)).filter((e) => e.role === "technician");
	const entries = await loadEntries({
		companyId: profile.employee.companyId,
		fromIso: `${from}T00:00:00-04:00`,
		toIso: `${to}T23:59:59-04:00`
	});
	const revenue = await (await getSql())`
      select technician_id, coalesce(sum(labor_amount),0) as labor, coalesce(sum(parts_amount),0) as parts
      from tickets
      where company_id = ${profile.employee.companyId}
        and scheduled_start >= ${`${from}T00:00:00-04:00`}::timestamptz
        and scheduled_start < ${`${to}T23:59:59-04:00`}::timestamptz
      group by technician_id
    `;
	const revMap = new Map(revenue.map((r) => [r.technician_id, {
		labor: num(r.labor),
		parts: num(r.parts)
	}]));
	return {
		profile,
		rows: people.map((employee) => {
			const hours = hoursFromEntries(entries.filter((e) => e.employeeId === employee.id));
			const rev = revMap.get(employee.id) ?? {
				labor: 0,
				parts: 0
			};
			return payrollForEmployee({
				employee,
				hours,
				settings: profile.settings,
				laborRevenue: rev.labor,
				partsRevenue: rev.parts
			});
		}),
		from,
		to
	};
});
var getEfficiency_createServerFn_handler = createServerRpc({
	id: "77bcda31d66d1c4dc6300b9f0c700d827fee6664ef096523fac7b45a888280bc",
	name: "getEfficiency",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => getEfficiency.__executeServer(opts));
var getEfficiency = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getEfficiency_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	await hydrateToday(profile.employee.companyId);
	assertManager(profile);
	const { from, to } = weekRange(profile.settings.timezone);
	const people = (await listEmployees(profile.employee.companyId, true)).filter((e) => e.role === "technician");
	const entries = await loadEntries({
		companyId: profile.employee.companyId,
		fromIso: `${from}T00:00:00-04:00`,
		toIso: `${to}T23:59:59-04:00`
	});
	const sql = await getSql();
	const revenue = await sql`
      select technician_id, coalesce(sum(labor_amount),0) as labor, coalesce(sum(parts_amount),0) as parts
      from tickets
      where company_id = ${profile.employee.companyId}
        and scheduled_start >= ${`${from}T00:00:00-04:00`}::timestamptz
        and scheduled_start < ${`${to}T23:59:59-04:00`}::timestamptz
      group by technician_id
    `;
	const schedules = await sql`
      select employee_id, sum(end_minutes - start_minutes) as minutes
      from schedules where active = true
      group by employee_id
    `;
	const schedMap = new Map(schedules.map((s) => [s.employee_id, num(s.minutes) / 60]));
	const revMap = new Map(revenue.map((r) => [r.technician_id, {
		labor: num(r.labor),
		parts: num(r.parts)
	}]));
	return {
		profile,
		rows: people.map((employee) => {
			const hours = hoursFromEntries(entries.filter((e) => e.employeeId === employee.id));
			const rev = revMap.get(employee.id) ?? {
				labor: 0,
				parts: 0
			};
			const available = profile.settings.efficiencyAvailableSource === "clock" ? hours.worked / 60 : schedMap.get(employee.id) ?? 42.5;
			return efficiencyForEmployee({
				employee,
				hours,
				availableHours: available,
				settings: profile.settings,
				laborRevenue: rev.labor,
				partsRevenue: rev.parts
			});
		}),
		from,
		to
	};
});
var listCodes_createServerFn_handler = createServerRpc({
	id: "946684875afbdcab2a31b8c3c1578f39ce244715507cf71fa4558a9b87db84d1",
	name: "listCodes",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => listCodes.__executeServer(opts));
var listCodes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listCodes_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	return {
		profile,
		items: (await (await getSql())`
      select id, code, description, category, trade, hours, labor_value, typical_duration_min, active, notes
      from code_book where company_id = ${profile.employee.companyId}
      order by code
    `).map((r) => ({
			...r,
			hours: num(r.hours),
			laborValue: num(r.labor_value),
			typicalDurationMin: num(r.typical_duration_min)
		}))
	};
});
var upsertCode_createServerFn_handler = createServerRpc({
	id: "bff7d2bb32176a5adb23e489b638d226532a4660f106ef486620e19fe5504bc0",
	name: "upsertCode",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => upsertCode.__executeServer(opts));
var upsertCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(upsertCode_createServerFn_handler, async ({ context, data }) => {
	const profile = await mgr(context.userId);
	assertAdmin(profile);
	const sql = await getSql();
	const id = data.id ?? newId("cb");
	await sql`
      insert into code_book (id, company_id, code, description, category, trade, hours, labor_value, typical_duration_min, active, notes, updated_at)
      values (${id}, ${profile.employee.companyId}, ${data.code.toUpperCase()}, ${data.description}, ${data.category},
        ${data.trade}, ${data.hours}, ${data.laborValue}, ${Math.round(data.hours * 60)}, ${data.active}, ${data.notes ?? null}, now())
      on conflict (id) do update set
        code = excluded.code, description = excluded.description, category = excluded.category,
        trade = excluded.trade, hours = excluded.hours, labor_value = excluded.labor_value,
        typical_duration_min = excluded.typical_duration_min, active = excluded.active,
        notes = excluded.notes, updated_at = now()
    `;
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: data.id ? "update_code" : "create_code",
		entityType: "code_book",
		entityId: id,
		newValue: data
	});
	return { id };
});
var getSettings_createServerFn_handler = createServerRpc({
	id: "8d885e5438c55f22de99dd6a6778dc9a1edf8c75ca6dd28b6abefcac0b9f16f5",
	name: "getSettings",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => getSettings.__executeServer(opts));
var getSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSettings_createServerFn_handler, async ({ context }) => {
	return { profile: await requireProfile(context.userId) };
});
var saveSettings_createServerFn_handler = createServerRpc({
	id: "ebd2a930ea41a21ce9210409f24fbe353273fb76ed3edbbdcdc30acee0c5a3e3",
	name: "saveSettings",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => saveSettings.__executeServer(opts));
var saveSettings = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(saveSettings_createServerFn_handler, async ({ context, data }) => {
	const profile = await mgr(context.userId);
	assertAdmin(profile);
	const sql = await getSql();
	const allowed = /* @__PURE__ */ new Set([
		"gps_radius_ft",
		"gps_interval_sec",
		"gps_grace_min",
		"gps_accuracy_threshold_m",
		"approaching_multiplier",
		"exception_tolerance_min",
		"overtime_daily_hours",
		"overtime_weekly_hours",
		"overtime_multiplier",
		"double_time_enabled",
		"travel_counts_as_field",
		"efficiency_available_source",
		"tracking_only_during_work",
		"labor_rate",
		"parts_markup",
		"location_retention_days"
	]);
	for (const [key, value] of Object.entries(data)) {
		if (!allowed.has(key)) continue;
		await sql`
        insert into settings (company_id, key, value, updated_at, updated_by)
        values (${profile.employee.companyId}, ${key}, ${String(value)}, now(), ${context.userId})
        on conflict (company_id, key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
      `;
	}
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "update_settings",
		entityType: "settings",
		newValue: data
	});
	return { ok: true };
});
var listAudit_createServerFn_handler = createServerRpc({
	id: "1b178e5f25a2b40350f3c9d572b4eef9be7b41bbb2af662b14b2a842754c4260",
	name: "listAudit",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => listAudit.__executeServer(opts));
var listAudit = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listAudit_createServerFn_handler, async ({ context }) => {
	const profile = await mgr(context.userId);
	return {
		profile,
		items: await (await getSql())`
      select id, actor_name as "actorName", action, entity_type as "entityType", entity_id as "entityId",
             original_value as "originalValue", new_value as "newValue", reason, ticket_id as "ticketId", created_at as "createdAt"
      from audit_logs
      where company_id = ${profile.employee.companyId}
      order by created_at desc
      limit 150
    `
	};
});
var getSchedules_createServerFn_handler = createServerRpc({
	id: "feb96307b17402618353ca8fe9b6ff7557c21bfce9a398367376237c7585bf53",
	name: "getSchedules",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => getSchedules.__executeServer(opts));
var getSchedules = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getSchedules_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	return {
		profile,
		people: profile.employee.role === "technician" ? [profile.employee] : await listEmployees(profile.employee.companyId, true),
		rows: await sql`
      select employee_id, day_of_week, start_minutes, end_minutes
      from schedules where active = true
      order by employee_id, day_of_week
    `
	};
});
var getReports_createServerFn_handler = createServerRpc({
	id: "43e3c00542fb7ed62857a4c3cf09cca15a5fb37b98e788c2c35dbf460d7390b9",
	name: "getReports",
	filename: "src/lib/field/api-ops.ts"
}, (opts) => getReports.__executeServer(opts));
var getReports = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getReports_createServerFn_handler, async ({ context }) => {
	const profile = await mgr(context.userId);
	const { from, to } = weekRange(profile.settings.timezone);
	const people = (await listEmployees(profile.employee.companyId, true)).filter((e) => e.role === "technician");
	const entries = await loadEntries({
		companyId: profile.employee.companyId,
		fromIso: `${from}T00:00:00-04:00`,
		toIso: `${to}T23:59:59-04:00`
	});
	const tickets = await (await getSql())`
      select ticket_number, customer_name, technician_id, labor_amount, parts_amount, invoice_amount, status
      from tickets where company_id = ${profile.employee.companyId}
        and scheduled_start >= ${`${from}T00:00:00-04:00`}::timestamptz
      order by scheduled_start desc
    `;
	return {
		profile,
		from,
		to,
		byEmp: people.map((employee) => {
			return {
				employee,
				hours: hoursFromEntries(entries.filter((e) => e.employeeId === employee.id))
			};
		}),
		tickets
	};
});
//#endregion
export { adjustEntry_createServerFn_handler, approveTimecard_createServerFn_handler, getEfficiency_createServerFn_handler, getPayroll_createServerFn_handler, getReports_createServerFn_handler, getSchedules_createServerFn_handler, getSettings_createServerFn_handler, listAudit_createServerFn_handler, listCodes_createServerFn_handler, listExceptions_createServerFn_handler, listTimecards_createServerFn_handler, resolveException_createServerFn_handler, saveSettings_createServerFn_handler, upsertCode_createServerFn_handler };
