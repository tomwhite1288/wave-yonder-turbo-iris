import { getSql } from "@/lib/db";
import { num, newId } from "@/lib/utils";
import type { CompanySettings, Employee, Role, SessionProfile } from "./types";
import { isListedAdminEmail, parseAdminEmails } from "./admin-auth.server";

type EmpRow = {
  id: string;
  company_id: string;
  user_id: string | null;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  department: string;
  labor_classification: string;
  pay_type: string;
  phone: string | null;
  vehicle: string | null;
  active: boolean;
  hourly_wage: number | string | null;
};

export function mapEmployee(row: EmpRow): Employee {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    employeeNumber: row.employee_number,
    firstName: row.first_name,
    lastName: row.last_name,
    name: `${row.first_name} ${row.last_name}`,
    email: row.email,
    role: row.role,
    department: row.department,
    laborClassification: row.labor_classification,
    payType: row.pay_type,
    phone: row.phone,
    vehicle: row.vehicle,
    active: row.active,
    hourlyWage: num(row.hourly_wage),
  };
}

const EMP_SELECT = `
  select e.*, (
    select pr.hourly_wage from pay_rates pr
    where pr.employee_id = e.id
      and pr.effective_from <= current_date
      and (pr.effective_to is null or pr.effective_to >= current_date)
    order by pr.effective_from desc
    limit 1
  ) as hourly_wage
  from employees e
`;

export async function loadSettings(companyId: string): Promise<CompanySettings> {
  const sql = await getSql();
  const rows = await sql<{ key: string; value: string }>`
    select key, value from settings where company_id = ${companyId}
  `;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const company = await sql<{ name: string; legal_name: string; timezone: string }>`
    select name, legal_name, timezone from companies where id = ${companyId}
  `;
  const c = company[0];
  const n = (k: string, d: number) => num(map[k] ?? d);
  return {
    gpsRadiusFt: n("gps_radius_ft", 250),
    gpsIntervalSec: n("gps_interval_sec", 30),
    gpsGraceMin: n("gps_grace_min", 5),
    gpsAccuracyThresholdM: n("gps_accuracy_threshold_m", 50),
    approachingMultiplier: n("approaching_multiplier", 3),
    exceptionToleranceMin: n("exception_tolerance_min", 15),
    overtimeDailyHours: n("overtime_daily_hours", 8),
    overtimeWeeklyHours: n("overtime_weekly_hours", 40),
    overtimeMultiplier: n("overtime_multiplier", 1.5),
    doubleTimeEnabled: (map.double_time_enabled ?? "false") === "true",
    travelCountsAsField: (map.travel_counts_as_field ?? "true") === "true",
    efficiencyAvailableSource: map.efficiency_available_source === "clock" ? "clock" : "schedule",
    trackingOnlyDuringWork: (map.tracking_only_during_work ?? "true") === "true",
    laborRate: n("labor_rate", 185),
    partsMarkup: n("parts_markup", 1.55),
    locationRetentionDays: n("location_retention_days", 90),
    timezone: c?.timezone ?? "America/New_York",
    companyName: c?.name ?? "Field Ledger",
    legalName: c?.legal_name ?? "Maichle's Heating & Air Conditioning, Inc.",
    companyId,
    adminEmails: parseAdminEmails(map.admin_emails),
    adminHintVisible: (map.admin_code_hint ?? "true") !== "false",
  };
}

export async function bootstrapProfile(opts: {
  userId: string;
  email: string | null;
  name: string | null;
}): Promise<SessionProfile> {
  const sql = await getSql();
  const existing = await sql.query<EmpRow>(`${EMP_SELECT} where e.user_id = $1`, [opts.userId]);
  if (existing[0]) {
    return finishProfile(existing[0], opts);
  }

  const email = (opts.email ?? "").trim().toLowerCase();
  if (email) {
    const byEmail = await sql.query<EmpRow>(
      `${EMP_SELECT} where lower(e.email) = $1 and e.user_id is null limit 1`,
      [email],
    );
    if (byEmail[0]) {
      await sql`
        update employees set user_id = ${opts.userId}, updated_at = now()
        where id = ${byEmail[0].id}
      `;
      return finishProfile({ ...byEmail[0], user_id: opts.userId }, opts);
    }
  }

  const unlinkedAdmin = await sql.query<EmpRow>(
    `${EMP_SELECT} where e.role = 'admin' and e.user_id is null order by e.created_at asc limit 1`,
  );
  if (unlinkedAdmin[0]) {
    const nextEmail = opts.email || unlinkedAdmin[0].email;
    const names = (opts.name ?? "").trim().split(/\s+/);
    const first = names[0] || unlinkedAdmin[0].first_name;
    const last = names.slice(1).join(" ") || unlinkedAdmin[0].last_name;
    await sql`
      update employees
      set user_id = ${opts.userId},
          email = ${nextEmail},
          first_name = ${first},
          last_name = ${last},
          updated_at = now()
      where id = ${unlinkedAdmin[0].id}
    `;
    return finishProfile(
      {
        ...unlinkedAdmin[0],
        user_id: opts.userId,
        email: nextEmail,
        first_name: first,
        last_name: last,
      },
      opts,
    );
  }

  const company = await sql<{ id: string }>`select id from companies order by created_at asc limit 1`;
  const companyId = company[0]?.id ?? "co_maichles";
  const names = (opts.name ?? "New Technician").trim().split(/\s+/);
  const id = newId("emp");
  const number = `E-${Math.floor(300 + Math.random() * 600)}`;
  const listed = await isListedAdminEmail(companyId, opts.email);
  const role: Role = listed ? "admin" : "technician";
  await sql`
    insert into employees (
      id, company_id, user_id, employee_number, first_name, last_name, email, role,
      department, labor_classification, pay_type, active
    ) values (
      ${id}, ${companyId}, ${opts.userId}, ${number},
      ${names[0] || "New"}, ${names.slice(1).join(" ") || (listed ? "Administrator" : "Technician")},
      ${opts.email || `${id}@maichlesedge.com`}, ${role},
      ${listed ? "Operations" : "Field"}, ${listed ? "Administrator" : "Technician"}, 'hourly', true
    )
  `;
  await sql`
    insert into pay_rates (id, employee_id, hourly_wage, effective_from, created_by)
    values (${newId("pr")}, ${id}, ${listed ? 55 : 30}, current_date, ${opts.userId})
  `;
  for (const day of [1, 2, 3, 4, 5]) {
    await sql`
      insert into schedules (id, employee_id, day_of_week, start_minutes, end_minutes, active)
      values (${newId("sch")}, ${id}, ${day}, 450, 960, true)
    `;
  }
  const created = await sql.query<EmpRow>(`${EMP_SELECT} where e.id = $1`, [id]);
  return finishProfile(created[0]!, opts);
}

async function finishProfile(row: EmpRow, opts: { userId: string; email: string | null; name: string | null }): Promise<SessionProfile> {
  const sql = await getSql();
  let emp = mapEmployee(row);
  const listed = await isListedAdminEmail(emp.companyId, opts.email || emp.email);
  if (listed && emp.role !== "admin") {
    await sql`
      update employees
      set role = 'admin',
          department = case when department = 'Field' then 'Operations' else department end,
          labor_classification = case when labor_classification = 'Technician' then 'Administrator' else labor_classification end,
          updated_at = now()
      where id = ${emp.id}
    `;
    emp = { ...emp, role: "admin" };
  }
  return {
    userId: opts.userId,
    email: opts.email,
    displayName: opts.name,
    employee: emp,
    settings: await loadSettings(emp.companyId),
  };
}

export async function requireProfile(userId: string): Promise<SessionProfile> {
  const sql = await getSql();
  const rows = await sql.query<EmpRow>(`${EMP_SELECT} where e.user_id = $1`, [userId]);
  if (!rows[0]) {
    throw Object.assign(new Error("No employee profile"), { status: 403 });
  }
  const emp = mapEmployee(rows[0]);
  return {
    userId,
    email: emp.email,
    displayName: emp.name,
    employee: emp,
    settings: await loadSettings(emp.companyId),
  };
}

export function assertManager(profile: SessionProfile) {
  if (profile.employee.role === "technician") {
    throw Object.assign(new Error("Manager access required"), { status: 403 });
  }
}

export function assertAdmin(profile: SessionProfile) {
  if (profile.employee.role !== "admin") {
    throw Object.assign(new Error("Administrator access required"), { status: 403 });
  }
}

export async function listEmployees(companyId: string, activeOnly = false): Promise<Employee[]> {
  const sql = await getSql();
  const rows = activeOnly
    ? await sql.query<EmpRow>(`${EMP_SELECT} where e.company_id = $1 and e.active = true order by e.last_name, e.first_name`, [companyId])
    : await sql.query<EmpRow>(`${EMP_SELECT} where e.company_id = $1 order by e.role, e.last_name`, [companyId]);
  return rows.map(mapEmployee);
}

export async function writeAudit(opts: {
  companyId: string;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  originalValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  ticketId?: string | null;
}) {
  const sql = await getSql();
  await sql`
    insert into audit_logs (
      id, company_id, actor_id, actor_name, action, entity_type, entity_id,
      original_value, new_value, reason, ticket_id
    ) values (
      ${newId("aud")}, ${opts.companyId}, ${opts.actorId ?? null}, ${opts.actorName ?? null},
      ${opts.action}, ${opts.entityType}, ${opts.entityId ?? null},
      ${opts.originalValue != null ? JSON.stringify(opts.originalValue) : null},
      ${opts.newValue != null ? JSON.stringify(opts.newValue) : null},
      ${opts.reason ?? null}, ${opts.ticketId ?? null}
    )
  `;
}

export { EMP_SELECT };
export type { EmpRow };
