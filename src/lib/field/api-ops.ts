import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/field/shop-middleware";
import { getSql, persistPgliteNow } from "@/lib/db";
import { newId, num } from "@/lib/utils";
import { efficiencyForEmployee, payrollForEmployee, weekRange } from "./calc";
import { hoursFromEntries, loadEntries, loadTickets } from "./queries.server";
import {
  assertAdmin,
  assertManager,
  listEmployees,
  requireProfile,
  writeAudit,
} from "./session.server";
import { hydrateToday } from "./hydrate.server";
import { reconcileWeek } from "./reconcile.server";
import type { CodeBookEntry, CodeBookKind, CodeImportRow, ExceptionView, PayrollRow, EfficiencyRow, AuditView } from "./types";

async function mgr(userId: string) {
  const profile = await requireProfile(userId);
  await hydrateToday(profile.employee.companyId);
  assertManager(profile);
  return profile;
}

export const listTimecards = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    await hydrateToday(profile.employee.companyId);
    const { from, to } = weekRange(profile.settings.timezone);
    const techId = profile.employee.role === "technician" ? profile.employee.id : undefined;
    const entries = await loadEntries({
      companyId: profile.employee.companyId,
      employeeId: techId,
      fromIso: `${from}T00:00:00-04:00`,
      toIso: `${to}T23:59:59-04:00`,
    });
    const sql = await getSql();
    const cards = techId
      ? await sql<{ id: string; employee_id: string; work_date: string; status: string; manager_note: string | null }>`
          select id, employee_id, work_date::text, status, manager_note from timecards
          where company_id = ${profile.employee.companyId} and employee_id = ${techId}
            and work_date between ${from}::date and ${to}::date
        `
      : await sql<{ id: string; employee_id: string; work_date: string; status: string; manager_note: string | null }>`
          select id, employee_id, work_date::text, status, manager_note from timecards
          where company_id = ${profile.employee.companyId}
            and work_date between ${from}::date and ${to}::date
        `;
    const people = await listEmployees(profile.employee.companyId, true);
    return { profile, entries, cards, people, from, to };
  });

export const adjustEntry = createServerFn({ method: "POST" })
  .validator((d: { entryId: string; clockIn: string; clockOut: string | null; reason: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await mgr(context.userId);
    if (!data.reason.trim()) throw new Error("Adjustment reason is required");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      clock_in: string;
      clock_out: string | null;
      original_clock_in: string | null;
      original_clock_out: string | null;
      ticket_id: string | null;
    }>`
      select id, clock_in, clock_out, original_clock_in, original_clock_out, ticket_id
      from time_entries where id = ${data.entryId} and company_id = ${profile.employee.companyId}
    `;
    const row = rows[0];
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
      originalValue: { clockIn: row.clock_in, clockOut: row.clock_out },
      newValue: { clockIn: data.clockIn, clockOut: data.clockOut },
      reason: data.reason,
    });
    return { ok: true };
  });

export const approveTimecard = createServerFn({ method: "POST" })
  .validator((d: { employeeId: string; workDate: string; note?: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await mgr(context.userId);
    const sql = await getSql();
    const existing = await sql<{ id: string }>`
      select id from timecards where employee_id = ${data.employeeId} and work_date = ${data.workDate}::date
    `;
    if (existing[0]) {
      await sql`
        update timecards set status = 'approved', approved_by = ${profile.employee.id},
          approved_at = now(), manager_note = ${data.note ?? null}, updated_at = now()
        where id = ${existing[0].id}
      `;
    } else {
      await sql`
        insert into timecards (id, company_id, employee_id, work_date, status, approved_by, approved_at, manager_note)
        values (${newId("tc")}, ${profile.employee.companyId}, ${data.employeeId}, ${data.workDate}::date,
          'approved', ${profile.employee.id}, now(), ${data.note ?? null})
      `;
    }
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
      reason: data.note,
    });
    return { ok: true };
  });

export const listExceptions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    await hydrateToday(profile.employee.companyId);
    const { from, to } = weekRange(profile.settings.timezone);
    try {
      await reconcileWeek({
        companyId: profile.employee.companyId,
        settings: profile.settings,
        fromIso: from,
        toIso: to,
      });
    } catch {
      /* recon is best-effort — listing still works if a new table is mid-migrate */
    }
    const sql = await getSql();
    const techFilter = profile.employee.role === "technician" ? profile.employee.id : null;
    const rows = techFilter
      ? await sql<{
          id: string;
          employee_id: string;
          first_name: string;
          last_name: string;
          ticket_id: string | null;
          ticket_number: string | null;
          kind: ExceptionView["kind"];
          severity: string;
          message: string;
          status: string;
          created_at: string;
        }>`
          select x.id, x.employee_id, e.first_name, e.last_name, x.ticket_id, t.ticket_number,
                 x.kind, x.severity, x.message, x.status, x.created_at
          from exceptions x
          join employees e on e.id = x.employee_id
          left join tickets t on t.id = x.ticket_id
          where x.company_id = ${profile.employee.companyId} and x.employee_id = ${techFilter}
          order by x.created_at desc
          limit 200
        `
      : await sql<{
          id: string;
          employee_id: string;
          first_name: string;
          last_name: string;
          ticket_id: string | null;
          ticket_number: string | null;
          kind: ExceptionView["kind"];
          severity: string;
          message: string;
          status: string;
          created_at: string;
        }>`
          select x.id, x.employee_id, e.first_name, e.last_name, x.ticket_id, t.ticket_number,
                 x.kind, x.severity, x.message, x.status, x.created_at
          from exceptions x
          join employees e on e.id = x.employee_id
          left join tickets t on t.id = x.ticket_id
          where x.company_id = ${profile.employee.companyId}
          order by x.created_at desc
          limit 200
        `;
    const items: ExceptionView[] = rows.map((r) => ({
      id: r.id,
      employeeId: r.employee_id,
      employeeName: `${r.first_name} ${r.last_name}`,
      ticketId: r.ticket_id,
      ticketNumber: r.ticket_number,
      kind: r.kind,
      severity: r.severity,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
    }));
    return { profile, items, from, to };
  });

export const resolveException = createServerFn({ method: "POST" })
  .validator((d: { id: string; status: "acknowledged" | "resolved" | "dismissed" }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await mgr(context.userId);
    const sql = await getSql();
    await sql`
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
      newValue: { status: data.status },
    });
    return { ok: true };
  });

export const getPayroll = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    await hydrateToday(profile.employee.companyId);
    if (profile.employee.role === "technician") {
      throw Object.assign(new Error("Manager access required"), { status: 403 });
    }
    const { from, to } = weekRange(profile.settings.timezone);
    const people = (await listEmployees(profile.employee.companyId, true)).filter((e) => e.role === "technician");
    const entries = await loadEntries({
      companyId: profile.employee.companyId,
      fromIso: `${from}T00:00:00-04:00`,
      toIso: `${to}T23:59:59-04:00`,
    });
    const sql = await getSql();
    const tickets = await loadTickets(profile.employee.companyId, profile.settings.gpsRadiusFt);
    const revenue = await sql<{ technician_id: string; labor: number | string; parts: number | string }>`
      select technician_id, coalesce(sum(labor_amount),0) as labor, coalesce(sum(parts_amount),0) as parts
      from tickets
      where company_id = ${profile.employee.companyId}
        and scheduled_start >= ${`${from}T00:00:00-04:00`}::timestamptz
        and scheduled_start < ${`${to}T23:59:59-04:00`}::timestamptz
      group by technician_id
    `;
    const revMap = new Map(revenue.map((r) => [r.technician_id, { labor: num(r.labor), parts: num(r.parts) }]));
    const rows: PayrollRow[] = people.map((employee) => {
      const hours = hoursFromEntries(entries.filter((e) => e.employeeId === employee.id));
      const jobs = tickets.filter((t) => t.technicianId === employee.id);
      const rev = revMap.get(employee.id) ?? {
        labor: jobs.reduce((s, t) => s + t.laborAmount, 0),
        parts: jobs.reduce((s, t) => s + t.partsAmount, 0),
      };
      return payrollForEmployee({
        employee,
        hours,
        settings: profile.settings,
        laborRevenue: rev.labor,
        partsRevenue: rev.parts,
      });
    });
    return { profile, rows, from, to };
  });

export const getEfficiency = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    await hydrateToday(profile.employee.companyId);
    assertManager(profile);
    const { from, to } = weekRange(profile.settings.timezone);
    const people = (await listEmployees(profile.employee.companyId, true)).filter((e) => e.role === "technician");
    const entries = await loadEntries({
      companyId: profile.employee.companyId,
      fromIso: `${from}T00:00:00-04:00`,
      toIso: `${to}T23:59:59-04:00`,
    });
    const sql = await getSql();
    const tickets = await loadTickets(profile.employee.companyId, profile.settings.gpsRadiusFt);
    const revenue = await sql<{ technician_id: string; labor: number | string; parts: number | string }>`
      select technician_id, coalesce(sum(labor_amount),0) as labor, coalesce(sum(parts_amount),0) as parts
      from tickets
      where company_id = ${profile.employee.companyId}
        and scheduled_start >= ${`${from}T00:00:00-04:00`}::timestamptz
        and scheduled_start < ${`${to}T23:59:59-04:00`}::timestamptz
      group by technician_id
    `;
    const schedules = await sql<{ employee_id: string; minutes: number | string }>`
      select employee_id, sum(end_minutes - start_minutes) as minutes
      from schedules where active = true
      group by employee_id
    `;
    const schedMap = new Map(schedules.map((s) => [s.employee_id, num(s.minutes) / 60]));
    const revMap = new Map(revenue.map((r) => [r.technician_id, { labor: num(r.labor), parts: num(r.parts) }]));
    const rows: EfficiencyRow[] = people.map((employee) => {
      const hours = hoursFromEntries(entries.filter((e) => e.employeeId === employee.id));
      const jobs = tickets.filter((t) => t.technicianId === employee.id);
      const soldHours = jobs.reduce((s, t) => s + t.expectedHours, 0);
      const rev = revMap.get(employee.id) ?? {
        labor: jobs.reduce((s, t) => s + t.laborAmount, 0),
        parts: jobs.reduce((s, t) => s + t.partsAmount, 0),
      };
      const available = profile.settings.efficiencyAvailableSource === "clock"
        ? hours.worked / 60
        : schedMap.get(employee.id) ?? 42.5;
      return efficiencyForEmployee({
        employee,
        hours,
        availableHours: available,
        soldHours,
        settings: profile.settings,
        laborRevenue: rev.labor,
        partsRevenue: rev.parts,
      });
    });
    const threshold = (profile.settings.efficiencyAlertPct || 80) / 100;
    try {
      await sql.query(`create table if not exists shop_alerts (
        id text primary key, company_id text not null, employee_id text, kind text not null,
        title text not null, body text not null, created_at timestamptz not null default now(), read_at timestamptz
      )`);
    } catch {
      /* */
    }
    for (const row of rows) {
      if (row.availableHours < 1) continue;
      if (row.billableEfficiency >= threshold) continue;
      try {
        const existing = await sql<{ id: string }>`
          select id from shop_alerts
          where employee_id = ${row.employee.id}
            and kind = 'efficiency'
            and created_at::date = current_date
          limit 1
        `;
        if (existing[0]) continue;
        await sql`
          insert into shop_alerts (id, company_id, employee_id, kind, title, body)
          values (
            ${newId("al")}, ${profile.employee.companyId}, ${row.employee.id}, 'efficiency',
            ${`${row.employee.name} efficiency ${Math.round(row.billableEfficiency * 100)}%`},
            ${`Sold ${row.soldHours.toFixed(1)}h ÷ available ${row.availableHours.toFixed(1)}h is below the ${profile.settings.efficiencyAlertPct}% target.`}
          )
        `;
      } catch {
        /* shop_alerts may not exist yet on an old dump */
      }
    }
    return { profile, rows, from, to, thresholdPct: profile.settings.efficiencyAlertPct };
  });

export const listCodes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      code: string;
      description: string;
      category: string;
      trade: string;
      book: string | null;
      hours: number | string;
      parts_allowance: number | string | null;
      labor_value: number | string;
      typical_duration_min: number | string;
      active: boolean;
      notes: string | null;
    }>`
      select id, code, description, category, trade, book, hours, parts_allowance, labor_value, typical_duration_min, active, notes
      from code_book where company_id = ${profile.employee.companyId}
      order by book, code
    `;
    const items: CodeBookEntry[] = rows.map((r) => ({
      id: r.id,
      code: r.code,
      description: r.description,
      category: r.category,
      trade: r.trade,
      book: r.book === "hvac" || r.book === "plumbing" ? r.book : "invoice",
      hours: num(r.hours),
      partsAllowance: num(r.parts_allowance),
      laborValue: num(r.labor_value),
      typicalDurationMin: num(r.typical_duration_min),
      active: r.active,
      notes: r.notes,
    }));
    return { profile, items };
  });

function asBook(v: string | undefined): CodeBookKind {
  const s = (v ?? "").toLowerCase();
  if (s.includes("hvac")) return "hvac";
  if (s.includes("plumb")) return "plumbing";
  return "invoice";
}

export const upsertCode = createServerFn({ method: "POST" })
  .validator((d: {
    id?: string;
    code: string;
    description: string;
    category: string;
    trade: string;
    book?: string;
    hours: number;
    partsAllowance?: number;
    laborValue: number;
    active: boolean;
    notes?: string;
  }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await mgr(context.userId);
    assertAdmin(profile);
    const sql = await getSql();
    const book = asBook(data.book);
    const trade = data.trade || (book === "invoice" ? "both" : book);
    let id = data.id;
    if (!id) {
      const existing = await sql<{ id: string }>`
        select id from code_book
        where company_id = ${profile.employee.companyId}
          and book = ${book}
          and code = ${data.code.toUpperCase()}
        limit 1
      `;
      id = existing[0]?.id ?? newId("code");
    }
    const codeId = id;
    await sql`
      insert into code_book (
        id, company_id, code, description, category, trade, book, hours, parts_allowance,
        labor_value, typical_duration_min, active, notes, updated_at
      ) values (
        ${codeId}, ${profile.employee.companyId}, ${data.code.toUpperCase()}, ${data.description}, ${data.category},
        ${trade}, ${book}, ${data.hours}, ${data.partsAllowance ?? 0}, ${data.laborValue},
        ${Math.round(data.hours * 60)}, ${data.active}, ${data.notes ?? null}, now()
      )
      on conflict (id) do update set
        code = excluded.code, description = excluded.description, category = excluded.category,
        trade = excluded.trade, book = excluded.book, hours = excluded.hours,
        parts_allowance = excluded.parts_allowance, labor_value = excluded.labor_value,
        typical_duration_min = excluded.typical_duration_min, active = excluded.active,
        notes = excluded.notes, updated_at = now()
    `;
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: data.id ? "update_code" : "create_code",
      entityType: "code_book",
      entityId: codeId,
      newValue: data,
    });
    return { id: codeId };
  });

export const importCodes = createServerFn({ method: "POST" })
  .validator((d: { rows: CodeImportRow[] }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await mgr(context.userId);
    assertAdmin(profile);
    if (!data.rows.length) throw new Error("No rows to import");
    if (data.rows.length > 2000) throw new Error("Import is limited to 2,000 rows at a time");
    const sql = await getSql();
    let upserted = 0;
    let skipped = 0;
    for (const raw of data.rows) {
      const code = String(raw.code ?? "").trim().toUpperCase();
      if (!code) {
        skipped += 1;
        continue;
      }
      const book = asBook(raw.book);
      const hours = num(raw.hours);
      const labor = num(raw.labor_value ?? raw.laborValue ?? raw.list_price);
      const parts = num(raw.parts_allowance ?? raw.partsAllowance);
      const trade = (raw.trade || (book === "invoice" ? "both" : book)).toLowerCase();
      const activeRaw = raw.active;
      const active = activeRaw === false || activeRaw === "false" || activeRaw === "0" ? false : true;
      const found = await sql<{ id: string }>`
        select id from code_book
        where company_id = ${profile.employee.companyId} and book = ${book} and code = ${code}
        limit 1
      `;
      if (found[0]) {
        await sql`
          update code_book set
            description = ${raw.description || code},
            category = ${raw.category || book},
            trade = ${trade},
            book = ${book},
            hours = ${hours},
            parts_allowance = ${parts},
            labor_value = ${labor},
            typical_duration_min = ${Math.round((hours || 1) * 60)},
            active = ${active},
            notes = ${raw.notes ?? null},
            updated_at = now()
          where id = ${found[0].id}
        `;
      } else {
        await sql`
          insert into code_book (
            id, company_id, code, description, category, trade, book, hours, parts_allowance,
            labor_value, typical_duration_min, active, notes, updated_at
          ) values (
            ${newId("code")}, ${profile.employee.companyId}, ${code}, ${raw.description || code},
            ${raw.category || book}, ${trade}, ${book}, ${hours}, ${parts}, ${labor},
            ${Math.round((hours || 1) * 60)}, ${active}, ${raw.notes ?? null}, now()
          )
        `;
      }
      upserted += 1;
    }
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "import_codes",
      entityType: "code_book",
      newValue: { upserted, skipped },
    });
    return { upserted, skipped };
  });

export const getSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    return { profile };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .validator((d: Record<string, string | number | boolean>) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await mgr(context.userId);
    assertAdmin(profile);
    const sql = await getSql();
    const allowed = new Set([
      "gps_radius_ft",
      "gps_interval_sec",
      "gps_grace_min",
      "gps_confirm_min",
      "gps_fail_flags_work",
      "pay_sold_hours",
      "efficiency_alert_pct",
      "pay_conditions",
      "weekly_email_to",
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
      "location_retention_days",
      "theme_id",
      "layout_mode",
      "dispatch_show_map",
      "dispatch_show_tiles",
      "signup_open",
      "signup_requires_approval",
      "mobile_dock",
      "role_nav",
      "office_name",
      "office_address",
      "office_city",
      "office_state",
      "office_zip",
      "office_lat",
      "office_lng",
      "office_radius_ft",
      "paid_kinds",
      "require_gps_for_pay",
      "payroll_fed_pct",
      "payroll_state_pct",
      "payroll_fica_pct",
      "office_sync_url",
      "office_sync_key",
      "trial_days",
      "setup_complete",
      "demo_locked",
    ]);
    if ("trial_days" in data && profile.trial.locked) {
      throw new Error("Enter the shop unlock code before changing trial length");
    }
    if ("trial_days" in data) {
      const days = Number(data.trial_days);
      if (!Number.isFinite(days) || days < 0 || days > 3650) {
        throw new Error("Trial days must be between 0 and 3650");
      }
    }
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
      newValue: data,
    });
    await persistPgliteNow();
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await mgr(context.userId);
    const sql = await getSql();
    const rows = await sql<AuditView>`
      select id, actor_name as "actorName", action, entity_type as "entityType", entity_id as "entityId",
             original_value as "originalValue", new_value as "newValue", reason, ticket_id as "ticketId", created_at as "createdAt"
      from audit_logs
      where company_id = ${profile.employee.companyId}
      order by created_at desc
      limit 150
    `;
    return { profile, items: rows };
  });

export const getSchedules = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    const sql = await getSql();
    const people = profile.employee.role === "technician"
      ? [profile.employee]
      : await listEmployees(profile.employee.companyId, true);
    const rows = await sql<{ employee_id: string; day_of_week: number; start_minutes: number; end_minutes: number }>`
      select employee_id, day_of_week, start_minutes, end_minutes
      from schedules where active = true
      order by employee_id, day_of_week
    `;
    return { profile, people, rows };
  });

export const getReports = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await mgr(context.userId);
    const { from, to } = weekRange(profile.settings.timezone);
    const people = (await listEmployees(profile.employee.companyId, true)).filter((e) => e.role === "technician");
    const entries = await loadEntries({
      companyId: profile.employee.companyId,
      fromIso: `${from}T00:00:00-04:00`,
      toIso: `${to}T23:59:59-04:00`,
    });
    const sql = await getSql();
    const tickets = await sql<{
      ticket_number: string;
      customer_name: string;
      technician_id: string | null;
      labor_amount: number | string;
      parts_amount: number | string;
      invoice_amount: number | string;
      status: string;
    }>`
      select ticket_number, customer_name, technician_id, labor_amount, parts_amount, invoice_amount, status
      from tickets where company_id = ${profile.employee.companyId}
        and scheduled_start >= ${`${from}T00:00:00-04:00`}::timestamptz
      order by scheduled_start desc
    `;
    const byEmp = people.map((employee) => {
      const hours = hoursFromEntries(entries.filter((e) => e.employeeId === employee.id));
      return { employee, hours };
    });
    return { profile, from, to, byEmp, tickets };
  });
