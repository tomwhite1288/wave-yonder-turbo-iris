import { getSql } from "@/lib/db";
import { num } from "@/lib/utils";
import { minutesBetween, classifyMinutes, emptyDayHours, addDayHours } from "./calc";
import { haversineMeters, metersToFeet, resolveGpsStatus } from "./geo";
import type {
  CompanySettings,
  DayHours,
  GpsStatus,
  LiveTechRow,
  TicketSummary,
  TimeEntryView,
  TimeKind,
} from "./types";
import { mapEmployee, type EmpRow, EMP_SELECT } from "./session.server";

type TicketRow = {
  id: string;
  ticket_number: string;
  customer_name: string;
  address_line: string;
  city: string;
  state: string;
  zip: string;
  lat: number | string | null;
  lng: number | string | null;
  gps_radius_ft: number | string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  technician_id: string | null;
  technician_name: string | null;
  invoice_number: string | null;
  invoice_amount: number | string | null;
  labor_amount: number | string | null;
  parts_amount: number | string | null;
  status: string;
};

type CodeRow = { ticket_id: string; code: string; hours_expected: number | string; labor_value: number | string };

export function mapTicket(row: TicketRow, codes: CodeRow[], defaultRadius: number): TicketSummary {
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
      laborValue: num(c.labor_value),
    })),
    expectedHours: attached.reduce((s, c) => s + num(c.hours_expected), 0),
  };
}

const TICKET_SELECT = `
  select t.id, t.ticket_number, t.customer_name, t.address_line, t.city, t.state, t.zip,
         t.lat, t.lng, t.gps_radius_ft, t.scheduled_start, t.scheduled_end, t.technician_id,
         trim(coalesce(e.first_name,'') || ' ' || coalesce(e.last_name,'')) as technician_name,
         t.invoice_number, t.invoice_amount, t.labor_amount, t.parts_amount, t.status
  from tickets t
  left join employees e on e.id = t.technician_id
`;

export async function loadTickets(companyId: string, defaultRadius: number, technicianId?: string): Promise<TicketSummary[]> {
  const sql = await getSql();
  const rows = technicianId
    ? await sql.query<TicketRow>(`${TICKET_SELECT} where t.company_id = $1 and t.technician_id = $2 order by t.scheduled_start asc`, [companyId, technicianId])
    : await sql.query<TicketRow>(`${TICKET_SELECT} where t.company_id = $1 order by t.scheduled_start asc`, [companyId]);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  const codes = await sql.query<CodeRow>(
    `select ticket_id, code, hours_expected, labor_value from ticket_codes where ticket_id in (${placeholders})`,
    ids,
  );
  return rows.map((r) => mapTicket(r, codes, defaultRadius));
}

export async function loadTicketById(id: string, defaultRadius: number): Promise<TicketSummary | null> {
  const sql = await getSql();
  const rows = await sql.query<TicketRow>(`${TICKET_SELECT} where t.id = $1`, [id]);
  if (!rows[0]) return null;
  const codes = await sql.query<CodeRow>(
    `select ticket_id, code, hours_expected, labor_value from ticket_codes where ticket_id = $1`,
    [id],
  );
  return mapTicket(rows[0], codes, defaultRadius);
}

type EntryRow = {
  id: string;
  employee_id: string;
  ticket_id: string | null;
  ticket_number: string | null;
  kind: TimeKind;
  clock_in: string;
  clock_out: string | null;
  billable_minutes: number | string;
  non_billable_minutes: number | string;
  gps_status: string | null;
  clock_in_distance_ft: number | string | null;
  notes: string | null;
  adjusted: boolean;
  adjustment_reason: string | null;
  approval_status: string;
  original_clock_in: string | null;
  original_clock_out: string | null;
};

export function mapEntry(row: EntryRow): TimeEntryView {
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
    originalClockOut: row.original_clock_out,
  };
}

export async function loadEntries(opts: {
  companyId: string;
  employeeId?: string;
  fromIso: string;
  toIso: string;
}): Promise<TimeEntryView[]> {
  const sql = await getSql();
  const rows = opts.employeeId
    ? await sql.query<EntryRow>(
        `select te.*, t.ticket_number
         from time_entries te
         left join tickets t on t.id = te.ticket_id
         where te.company_id = $1 and te.employee_id = $2
           and te.clock_in < $4 and (te.clock_out is null or te.clock_out >= $3)
         order by te.clock_in asc`,
        [opts.companyId, opts.employeeId, opts.fromIso, opts.toIso],
      )
    : await sql.query<EntryRow>(
        `select te.*, t.ticket_number
         from time_entries te
         left join tickets t on t.id = te.ticket_id
         where te.company_id = $1
           and te.clock_in < $3 and (te.clock_out is null or te.clock_out >= $2)
         order by te.clock_in asc`,
        [opts.companyId, opts.fromIso, opts.toIso],
      );
  return rows.map(mapEntry);
}

export function hoursFromEntries(entries: TimeEntryView[], now = new Date()): DayHours {
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
      worked,
    });
  }, emptyDayHours());
}

export async function liveBoard(companyId: string, settings: CompanySettings): Promise<LiveTechRow[]> {
  const sql = await getSql();
  const techs = await sql.query<EmpRow>(
    `${EMP_SELECT} where e.company_id = $1 and e.role = 'technician' and e.active = true order by e.last_name`,
    [companyId],
  );
  const tickets = await loadTickets(companyId, settings.gpsRadiusFt);
  const todayStart = `${new Date().toLocaleString("en-CA", { timeZone: settings.timezone }).slice(0, 10)}T00:00:00-04:00`;
  const todayEnd = `${new Date().toLocaleString("en-CA", { timeZone: settings.timezone }).slice(0, 10)}T23:59:59-04:00`;
  const entries = await loadEntries({ companyId, fromIso: todayStart, toIso: todayEnd });
  const exceptions = await sql<{ employee_id: string; c: number }>`
    select employee_id, count(*)::int as c from exceptions
    where company_id = ${companyId} and status = 'open'
    group by employee_id
  `;
  const exMap = new Map(exceptions.map((e) => [e.employee_id, e.c]));
  const gps = await sql<{ employee_id: string; lat: number; lng: number; recorded_at: string; distance_ft: number | null; status: string }>`
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
    const ticket = open?.ticketId
      ? tickets.find((t) => t.id === open.ticketId) ?? null
      : tickets
          .filter((t) => t.technicianId === employee.id && t.status !== "complete")
          .sort((a, b) => String(a.scheduledStart ?? "").localeCompare(String(b.scheduledStart ?? "")))[0]
        ?? tickets
          .filter((t) => t.technicianId === employee.id)
          .sort((a, b) => String(b.scheduledStart ?? "").localeCompare(String(a.scheduledStart ?? "")))[0]
        ?? null;
    const last = gpsMap.get(employee.id);
    let distanceFt = last?.distance_ft == null ? null : num(last.distance_ft);
    if (distanceFt == null && last && ticket?.lat != null && ticket.lng != null) {
      distanceFt = metersToFeet(haversineMeters(num(last.lat), num(last.lng), ticket.lat, ticket.lng));
    }
    const clockedIn = Boolean(open && open.kind === "work");
    const previouslyOnSite = last?.status === "WORKING" || last?.status === "ON_SITE" || last?.status === "LEFT_SITE";
    const gpsStatus: GpsStatus = last
      ? resolveGpsStatus({
          hasFix: true,
          distanceFt,
          radiusFt: ticket?.gpsRadiusFt ?? settings.gpsRadiusFt,
          approachingMultiplier: settings.approachingMultiplier,
          clockedIn,
          previouslyOnSite,
        })
      : "OFFLINE";
    const arrival = open?.clockIn ?? null;
    const durationMin = open ? minutesBetween(open.clockIn, open.clockOut) : hours.worked;
    const available = 8.5;
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
      efficiency: hours.billable > 0 ? hours.billable / 60 / available : null,
      clockedIn,
    };
  });
}

export { TICKET_SELECT };
export type { TicketRow, CodeRow, EntryRow };
