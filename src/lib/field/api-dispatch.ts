import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/field/shop-middleware";
import { getSql, persistPgliteNow } from "@/lib/db";
import { newId } from "@/lib/utils";
import { assertActive, assertManager, listEmployees, requireProfile, writeAudit } from "./session.server";
import { hydrateToday } from "./hydrate.server";
import { liveBoard, loadTickets } from "./queries.server";
import type { JobKind } from "./types";

async function desk(userId: string) {
  const profile = await requireProfile(userId);
  await hydrateToday(profile.employee.companyId);
  assertActive(profile);
  assertManager(profile);
  return profile;
}

export const getDispatchDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await desk(context.userId);
    const tickets = await loadTickets(profile.employee.companyId, profile.settings.gpsRadiusFt);
    const rows = await liveBoard(profile.employee.companyId, profile.settings);
    const people = (await listEmployees(profile.employee.companyId, true)).filter(
      (e) => e.role === "technician" || e.role === "manager",
    );
    const sql = await getSql();
    const openEx = await sql<{ c: number }>`
      select count(*)::int as c from exceptions
      where company_id = ${profile.employee.companyId} and status = 'open'
    `;
    return {
      profile,
      tickets,
      rows,
      people,
      openExceptions: openEx[0]?.c ?? 0,
      generatedAt: new Date().toISOString(),
    };
  });

type WorkOrderInput = {
  ticketNumber?: string;
  customerName: string;
  addressLine: string;
  city?: string;
  state?: string;
  zip?: string;
  appointmentStart?: string | null;
  appointmentEnd?: string | null;
  technicianId?: string | null;
  workDetail?: string;
  notes?: string;
  lat?: number | null;
  lng?: number | null;
  jobKind?: JobKind;
};

export const createWorkOrder = createServerFn({ method: "POST" })
  .validator((d: WorkOrderInput) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await desk(context.userId);
    const customer = data.customerName.trim();
    if (!customer) throw new Error("Customer is required");
    const sql = await getSql();
    let number = (data.ticketNumber ?? "").replace(/\D/g, "");
    if (!number) {
      const last = await sql<{ n: string }>`
        select ticket_number as n from tickets
        where company_id = ${profile.employee.companyId}
        order by created_at desc limit 1
      `;
      const prev = Number.parseInt((last[0]?.n ?? "700000").replace(/\D/g, ""), 10);
      number = String(Number.isFinite(prev) ? prev + 1 : 700001);
    }
    const exists = await sql<{ id: string }>`
      select id from tickets where company_id = ${profile.employee.companyId} and ticket_number = ${number}
    `;
    if (exists[0]) throw new Error(`Ticket ${number} already exists`);
    const id = newId("tkt");
    const techId = data.technicianId || null;
    const status = techId ? "scheduled" : "scheduled";
    const jobKind: JobKind =
      data.jobKind === "callback" || data.jobKind === "warranty" ? data.jobKind : "service";
    await sql.query("alter table tickets add column if not exists job_kind text not null default 'service'");
    await sql`
      insert into tickets (
        id, company_id, ticket_number, customer_name, address_line, city, state, zip,
        lat, lng, gps_radius_ft, scheduled_start, scheduled_end, technician_id,
        status, source, notes, work_detail, job_kind, created_by
      ) values (
        ${id}, ${profile.employee.companyId}, ${number}, ${customer},
        ${data.addressLine.trim() || "Address TBD"}, ${data.city?.trim() || "New Castle"},
        ${data.state?.trim() || "DE"}, ${data.zip?.trim() || "19720"},
        ${data.lat ?? null}, ${data.lng ?? null}, ${profile.settings.gpsRadiusFt},
        ${data.appointmentStart ?? null}, ${data.appointmentEnd ?? null}, ${techId},
        ${status}, 'manual', ${data.notes?.trim() || null}, ${data.workDetail?.trim() || null},
        ${jobKind}, ${context.userId}
      )
    `;
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "create_work_order",
      entityType: "ticket",
      entityId: id,
      ticketId: id,
      newValue: { ticketNumber: number, technicianId: techId, customer },
    });
    await persistPgliteNow();
    return { id, ticketNumber: number };
  });

export const assignWorkOrder = createServerFn({ method: "POST" })
  .validator((d: { ticketId: string; technicianId: string | null; appointmentStart?: string | null; appointmentEnd?: string | null }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await desk(context.userId);
    const sql = await getSql();
    const row = await sql<{ id: string; technician_id: string | null; scheduled_start: string | null }>`
      select id, technician_id, scheduled_start from tickets
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
    if (!row[0]) throw new Error("Work order not found");
    await sql`
      update tickets set
        technician_id = ${data.technicianId},
        scheduled_start = ${data.appointmentStart ?? row[0].scheduled_start},
        scheduled_end = ${data.appointmentEnd ?? null},
        status = case when ${data.technicianId} is null then 'scheduled' else 'scheduled' end,
        updated_at = now(),
        updated_by = ${context.userId}
      where id = ${data.ticketId}
    `;
    if (data.technicianId) {
      try {
        await sql.query(`create table if not exists shop_alerts (
          id text primary key, company_id text not null, employee_id text, kind text not null,
          title text not null, body text not null, created_at timestamptz not null default now(), read_at timestamptz
        )`);
        await sql`
          insert into shop_alerts (id, company_id, employee_id, kind, title, body)
          values (
            ${newId("al")}, ${profile.employee.companyId}, ${data.technicianId}, 'ticket',
            'Ticket assigned',
            ${`A work order was assigned to you.`}
          )
        `;
      } catch {
        /* alerts are best-effort */
      }
    }
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: data.technicianId ? "assign_work_order" : "unassign_work_order",
      entityType: "ticket",
      entityId: data.ticketId,
      ticketId: data.ticketId,
      originalValue: { technicianId: row[0].technician_id },
      newValue: { technicianId: data.technicianId, appointmentStart: data.appointmentStart },
    });
    await persistPgliteNow();
    return { ok: true };
  });

export const setWorkOrderStatus = createServerFn({ method: "POST" })
  .validator((d: { ticketId: string; status: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await desk(context.userId);
    const allowed = new Set(["scheduled", "in_progress", "complete"]);
    if (!allowed.has(data.status)) throw new Error("Invalid status");
    const sql = await getSql();
    await sql`
      update tickets set status = ${data.status}, updated_at = now(), updated_by = ${context.userId}
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
    return { ok: true };
  });

export const setTicketJobKind = createServerFn({ method: "POST" })
  .validator((d: { ticketId: string; jobKind: JobKind }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await desk(context.userId);
    const kind: JobKind =
      data.jobKind === "callback" || data.jobKind === "warranty" ? data.jobKind : "service";
    const sql = await getSql();
    await sql.query("alter table tickets add column if not exists job_kind text not null default 'service'");
    await sql`
      update tickets set job_kind = ${kind}, updated_at = now(), updated_by = ${context.userId}
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
    return { ok: true as const };
  });

