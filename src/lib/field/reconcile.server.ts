import { getSql } from "@/lib/db";
import { newId, num } from "@/lib/utils";
import { discrepancyKind, hoursFromEntries } from "./calc";
import { loadEntries, loadTickets } from "./queries.server";
import type { CompanySettings, ExceptionKind } from "./types";

async function openExists(
  companyId: string,
  employeeId: string,
  kind: ExceptionKind,
  ticketId: string | null,
  dayIso: string,
) {
  const sql = await getSql();
  const rows = ticketId
    ? await sql<{ id: string }>`
        select id from exceptions
        where company_id = ${companyId}
          and employee_id = ${employeeId}
          and kind = ${kind}
          and ticket_id = ${ticketId}
          and status = 'open'
          and created_at::date = ${dayIso}::date
        limit 1
      `
    : await sql<{ id: string }>`
        select id from exceptions
        where company_id = ${companyId}
          and employee_id = ${employeeId}
          and kind = ${kind}
          and ticket_id is null
          and status = 'open'
          and created_at::date = ${dayIso}::date
        limit 1
      `;
  return Boolean(rows[0]);
}

async function raise(
  companyId: string,
  employeeId: string,
  kind: ExceptionKind,
  message: string,
  opts: { ticketId?: string | null; severity?: string; timeEntryId?: string | null; dayIso: string },
) {
  if (await openExists(companyId, employeeId, kind, opts.ticketId ?? null, opts.dayIso)) return;
  const sql = await getSql();
  await sql`
    insert into exceptions (
      id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status
    ) values (
      ${newId("ex")}, ${companyId}, ${employeeId}, ${opts.ticketId ?? null},
      ${opts.timeEntryId ?? null}, ${kind}, ${opts.severity ?? "warning"}, ${message}, 'open'
    )
  `;
}

export async function reconcileWeek(opts: {
  companyId: string;
  settings: CompanySettings;
  fromIso: string;
  toIso: string;
}) {
  const tickets = await loadTickets(opts.companyId, opts.settings.gpsRadiusFt);
  const entries = await loadEntries({
    companyId: opts.companyId,
    fromIso: `${opts.fromIso}T00:00:00-04:00`,
    toIso: `${opts.toIso}T23:59:59-04:00`,
  });
  const sql = await getSql();
  let receipts: { ticket_id: string; code: string | null; amount: number | string }[] = [];
  try {
    receipts = await sql<{ ticket_id: string; code: string | null; amount: number | string }>`
      select ticket_id, code, amount from job_receipts
      where company_id = ${opts.companyId}
    `;
  } catch {
    receipts = [];
  }
  const allowances = await sql<{ code: string; parts_allowance: number | string }>`
    select code, parts_allowance from code_book where company_id = ${opts.companyId}
  `;
  const allowMap = new Map(allowances.map((a) => [a.code, num(a.parts_allowance)]));

  for (const ticket of tickets) {
    const day = (ticket.scheduledStart ?? opts.fromIso).slice(0, 10);
    if (!ticket.technicianId) continue;
    const mine = entries.filter((e) => e.ticketId === ticket.id);
    const inWeek = day >= opts.fromIso && day <= opts.toIso;
    const hours = hoursFromEntries(mine);
    const onSiteHrs = (hours.billable + hours.show) / 60;
    if (mine.length === 0 && ticket.status !== "complete") {
      await raise(
        opts.companyId,
        ticket.technicianId,
        "missing_time",
        `Ticket #${ticket.ticketNumber} (${ticket.customerName}) has no GPS-backed punches this week.`,
        { ticketId: ticket.id, severity: "info", dayIso: inWeek ? day : opts.toIso },
      );
    }
    if (!inWeek && mine.length === 0) continue;
    const kind = discrepancyKind(
      onSiteHrs,
      ticket.expectedHours,
      opts.settings.exceptionToleranceMin,
      ticket.codes.length > 0,
    );
    if (kind) {
      const msg =
        kind === "missing_code"
          ? `On-site time ${onSiteHrs.toFixed(2)}h on #${ticket.ticketNumber} with no invoice/job code.`
          : kind === "under_billed"
            ? `On-site ${onSiteHrs.toFixed(2)}h vs coded ${ticket.expectedHours.toFixed(2)}h on #${ticket.ticketNumber}. Codes under-cover the field time.`
            : `Coded ${ticket.expectedHours.toFixed(2)}h vs on-site ${onSiteHrs.toFixed(2)}h on #${ticket.ticketNumber}. Codes exceed GPS-backed time.`;
      await raise(opts.companyId, ticket.technicianId, kind, msg, {
        ticketId: ticket.id,
        dayIso: day,
      });
    }
  }

  for (const entry of entries) {
    const day = entry.clockIn.slice(0, 10);
    if (entry.unpaidMinutes > 1 && !entry.gpsBacked) {
      await raise(
        opts.companyId,
        entry.employeeId,
        "unpaid_claim",
        `${entry.kind} ${Math.round(entry.unpaidMinutes)} min not paid — GPS did not back the claim${entry.ticketNumber ? ` on #${entry.ticketNumber}` : ""}.`,
        { ticketId: entry.ticketId, timeEntryId: entry.id, dayIso: day },
      );
    }
    if (entry.kind === "office" && entry.gpsStatus && entry.gpsStatus !== "AT_OFFICE") {
      await raise(
        opts.companyId,
        entry.employeeId,
        "office_mismatch",
        `Office time claimed while GPS was ${entry.gpsStatus.replaceAll("_", " ").toLowerCase()}.`,
        { ticketId: entry.ticketId, timeEntryId: entry.id, dayIso: day },
      );
    }
    if (entry.kind === "travel" && (entry.gpsStatus === "ON_SITE" || entry.gpsStatus === "WORKING" || entry.gpsStatus === "AT_OFFICE")) {
      await raise(
        opts.companyId,
        entry.employeeId,
        "travel_mismatch",
        `Travel claimed while GPS was ${entry.gpsStatus.replaceAll("_", " ").toLowerCase()}.`,
        { ticketId: entry.ticketId, timeEntryId: entry.id, dayIso: day },
      );
    }
  }

  for (const rec of receipts) {
    const code = rec.code;
    if (!code) continue;
    const cap = allowMap.get(code);
    if (cap == null || cap <= 0) continue;
    const amount = num(rec.amount);
    if (amount > cap * 1.05) {
      const ticket = tickets.find((t) => t.id === rec.ticket_id);
      if (!ticket?.technicianId) continue;
      await raise(
        opts.companyId,
        ticket.technicianId,
        "parts_over_allowance",
        `Receipt $${amount.toFixed(2)} exceeds ${code} parts range $${cap.toFixed(2)} on #${ticket.ticketNumber}.`,
        { ticketId: ticket.id, dayIso: opts.toIso, severity: "warning" },
      );
    }
  }
}
