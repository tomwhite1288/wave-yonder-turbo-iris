import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";
import { newId, num } from "@/lib/utils";
import { hydrateToday } from "./hydrate.server";
import { hoursFromEntries, loadEntries, loadTickets } from "./queries.server";
import { loadSettings } from "./session.server";
import { writeAudit } from "./session.server";

const DEMO_KEY = "fld_demo_maichles_edge_2026";

function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function authorizeIntegration(request: Request) {
  const raw = request.headers.get("x-field-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!raw) return null;
  const sql = await getSql();
  const hashed = hashKey(raw);
  const rows = await sql<{ company_id: string; id: string }>`
    select company_id, id from api_keys where key_hash = ${hashed} and active = true limit 1
  `;
  if (rows[0]) {
    await sql`update api_keys set last_used_at = now() where id = ${rows[0].id}`;
    return rows[0].company_id;
  }
  if (raw === DEMO_KEY) return "co_maichles";
  return null;
}

export type InboundTicket = {
  ticketNumber: string;
  customer?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  technicianEmail?: string;
  technicianId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  laborAmount?: number;
  partsAmount?: number;
  codes?: string[];
  notes?: string;
};

export async function ingestTicket(companyId: string, payload: InboundTicket) {
  if (!payload.ticketNumber) throw new Error("ticketNumber is required");
  const sql = await getSql();
  await hydrateToday(companyId);
  let techId: string | null = payload.technicianId ?? null;
  if (!techId && payload.technicianEmail) {
    const emp = await sql<{ id: string }>`
      select id from employees where company_id = ${companyId} and lower(email) = ${payload.technicianEmail.toLowerCase()}
    `;
    techId = emp[0]?.id ?? null;
  }
  const existing = await sql<{ id: string }>`
    select id from tickets where company_id = ${companyId} and ticket_number = ${payload.ticketNumber}
  `;
  const id = existing[0]?.id ?? newId("tkt");
  const address = payload.address ?? "Address pending";
  if (existing[0]) {
    await sql`
      update tickets set
        customer_name = coalesce(${payload.customer ?? null}, customer_name),
        address_line = coalesce(${payload.address ?? null}, address_line),
        lat = coalesce(${payload.lat ?? null}, lat),
        lng = coalesce(${payload.lng ?? null}, lng),
        technician_id = coalesce(${techId}, technician_id),
        scheduled_start = coalesce(${payload.scheduledStart ?? null}, scheduled_start),
        scheduled_end = coalesce(${payload.scheduledEnd ?? null}, scheduled_end),
        invoice_number = coalesce(${payload.invoiceNumber ?? null}, invoice_number),
        invoice_amount = coalesce(${payload.invoiceAmount ?? null}, invoice_amount),
        labor_amount = coalesce(${payload.laborAmount ?? null}, labor_amount),
        parts_amount = coalesce(${payload.partsAmount ?? null}, parts_amount),
        source = 'api',
        updated_at = now()
      where id = ${id}
    `;
  } else {
    await sql`
      insert into tickets (
        id, company_id, ticket_number, customer_name, address_line, city, state, zip,
        lat, lng, scheduled_start, scheduled_end, technician_id, invoice_number,
        invoice_amount, labor_amount, parts_amount, status, source
      ) values (
        ${id}, ${companyId}, ${payload.ticketNumber}, ${payload.customer ?? "Imported customer"},
        ${address}, ${payload.city ?? "New Castle"}, ${payload.state ?? "DE"}, ${payload.zip ?? "19720"},
        ${payload.lat ?? null}, ${payload.lng ?? null}, ${payload.scheduledStart ?? null},
        ${payload.scheduledEnd ?? null}, ${techId}, ${payload.invoiceNumber ?? null},
        ${payload.invoiceAmount ?? 0}, ${payload.laborAmount ?? 0}, ${payload.partsAmount ?? 0},
        'scheduled', 'api'
      )
    `;
  }
  if (payload.codes) {
    await sql`delete from ticket_codes where ticket_id = ${id}`;
    const book = await sql<{ code: string; hours: number; labor_value: number }>`
      select code, hours, labor_value from code_book where company_id = ${companyId}
    `;
    const map = new Map(book.map((c) => [c.code, c]));
    for (const code of payload.codes) {
      const def = map.get(code);
      await sql`
        insert into ticket_codes (id, ticket_id, code, hours_expected, labor_value)
        values (${newId("tc")}, ${id}, ${code}, ${def?.hours ?? 0}, ${def?.labor_value ?? 0})
      `;
      if (!def) {
        await sql`
          insert into exceptions (id, company_id, employee_id, ticket_id, kind, severity, message, status)
          select ${newId("ex")}, ${companyId}, coalesce(${techId}, (select id from employees where company_id = ${companyId} and role = 'admin' limit 1)),
            ${id}, 'invalid_code', 'warning', ${`Invoice contains code ${code} not found in the Code Book.`}, 'open'
        `;
      }
    }
  }
  await writeAudit({
    companyId,
    actorName: "Integration API",
    action: "ingest_ticket",
    entityType: "ticket",
    entityId: id,
    ticketId: id,
    newValue: payload,
  });
  return { id, ticketNumber: payload.ticketNumber };
}

export async function ticketAccountability(companyId: string, ticketNumber: string) {
  const settings = await loadSettings(companyId);
  const tickets = await loadTickets(companyId, settings.gpsRadiusFt);
  const ticket = tickets.find((t) => t.ticketNumber === ticketNumber);
  if (!ticket) return null;
  const entries = await loadEntries({
    companyId,
    fromIso: "2000-01-01T00:00:00Z",
    toIso: "2100-01-01T00:00:00Z",
  });
  const mine = entries.filter((e) => e.ticketId === ticket.id);
  const hours = hoursFromEntries(mine);
  const sql = await getSql();
  const exceptions = await sql<{ kind: string; message: string; status: string }>`
    select kind, message, status from exceptions where ticket_id = ${ticket.id}
  `;
  const gps = await sql<{ status: string; distance_ft: number | null; recorded_at: string }>`
    select status, distance_ft, recorded_at from gps_events
    where ticket_id = ${ticket.id} order by recorded_at desc limit 1
  `;
  return {
    ticketNumber: ticket.ticketNumber,
    technicianTime: {
      billableHours: hours.billable / 60,
      nonBillableHours: hours.nonBillable / 60,
      travelHours: hours.travel / 60,
      workedHours: hours.worked / 60,
    },
    gpsAttendance: gps[0]
      ? { status: gps[0].status, distanceFt: gps[0].distance_ft == null ? null : num(gps[0].distance_ft), at: gps[0].recorded_at }
      : { status: "OFFLINE", distanceFt: null, at: null },
    expectedHours: ticket.expectedHours,
    codes: ticket.codes,
    exceptions,
    invoice: {
      number: ticket.invoiceNumber,
      amount: ticket.invoiceAmount,
    },
  };
}
