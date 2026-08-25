import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { newId, num, todayIso } from "@/lib/utils";
import { haversineMeters, metersToFeet, resolveGpsStatus } from "./geo";
import { minutesBetween, discrepancyKind } from "./calc";
import {
  assertManager,
  bootstrapProfile,
  listEmployees,
  requireProfile,
  writeAudit,
} from "./session.server";
import { hydrateToday } from "./hydrate.server";
import {
  hoursFromEntries,
  liveBoard,
  loadEntries,
  loadTicketById,
  loadTickets,
  mapEntry,
  type EntryRow,
} from "./queries.server";
import type { TimeKind } from "./types";

async function ready(userId: string) {
  const sql = await getSql();
  const users = await sql.query<{ id: string; name: string; email: string }>(
    `select id, name, email from "user" where id = $1`,
    [userId],
  );
  const u = users[0];
  const profile = await bootstrapProfile({
    userId,
    email: u?.email ?? null,
    name: u?.name ?? null,
  });
  await hydrateToday(profile.employee.companyId);
  return profile;
}

export const getSessionProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => ready(context.userId));

export const getLiveBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ready(context.userId);
    assertManager(profile);
    const rows = await liveBoard(profile.employee.companyId, profile.settings);
    const sql = await getSql();
    const openEx = await sql<{ c: number }>`
      select count(*)::int as c from exceptions
      where company_id = ${profile.employee.companyId} and status = 'open'
    `;
    return {
      profile,
      rows,
      openExceptions: openEx[0]?.c ?? 0,
      generatedAt: new Date().toISOString(),
    };
  });

export const getFieldToday = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ready(context.userId);
    const asTechId = profile.employee.role === "technician" ? profile.employee.id : undefined;
    const settings = profile.settings;
    const tickets = (await loadTickets(profile.employee.companyId, settings.gpsRadiusFt, asTechId)).filter(
      (t) => t.status !== "complete",
    );
    const today = todayIso(settings.timezone);
    const entries = await loadEntries({
      companyId: profile.employee.companyId,
      employeeId: profile.employee.role === "technician" ? profile.employee.id : profile.employee.id,
      fromIso: `${today}T00:00:00-04:00`,
      toIso: `${today}T23:59:59-04:00`,
    });
    const hours = hoursFromEntries(entries);
    const open = entries.find((e) => !e.clockOut) ?? null;
    const currentTicket = open?.ticketId
      ? (tickets.find((t) => t.id === open.ticketId) ?? null)
      : tickets.find((t) => t.status === "in_progress" || t.status === "scheduled") ?? null;
    const sql = await getSql();
    const exceptions = await sql<{ id: string; kind: string; message: string; status: string; created_at: string }>`
      select id, kind, message, status, created_at from exceptions
      where employee_id = ${profile.employee.id} and created_at::date = ${today}::date
      order by created_at desc
    `;
    return {
      profile,
      tickets,
      entries,
      hours,
      open,
      currentTicket,
      exceptions,
      trackingActive: Boolean(open) || !settings.trackingOnlyDuringWork,
    };
  });

export const listJobs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ready(context.userId);
    const techId = profile.employee.role === "technician" ? profile.employee.id : undefined;
    const tickets = await loadTickets(profile.employee.companyId, profile.settings.gpsRadiusFt, techId);
    return { profile, tickets };
  });

export const getJob = createServerFn({ method: "GET" })
  .validator((ticketId: string) => ticketId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: ticketId }) => {
    const profile = await ready(context.userId);
    const ticket = await loadTicketById(ticketId, profile.settings.gpsRadiusFt);
    if (!ticket) throw new Error("Ticket not found");
    if (profile.employee.role === "technician" && ticket.technicianId !== profile.employee.id) {
      throw Object.assign(new Error("Not assigned to this ticket"), { status: 403 });
    }
    const sql = await getSql();
    const entries = await sql.query<EntryRow>(
      `select te.*, t.ticket_number from time_entries te
       left join tickets t on t.id = te.ticket_id
       where te.ticket_id = $1 order by te.clock_in`,
      [ticketId],
    );
    const parts = await sql<{
      id: string;
      part_number: string;
      manufacturer: string;
      description: string;
      quantity: number;
      unit_price: number | string;
    }>`
      select tp.id, p.part_number, p.manufacturer, p.description, tp.quantity, tp.unit_price
      from ticket_parts tp join parts p on p.id = tp.part_id
      where tp.ticket_id = ${ticketId}
    `;
    const exceptions = await sql<{ id: string; kind: string; severity: string; message: string; status: string; created_at: string }>`
      select id, kind, severity, message, status, created_at from exceptions
      where ticket_id = ${ticketId} order by created_at desc
    `;
    return {
      profile,
      ticket,
      entries: entries.map(mapEntry),
      parts: parts.map((p) => ({ ...p, unit_price: num(p.unit_price) })),
      exceptions,
    };
  });

type GpsInput = {
  ticketId?: string | null;
  lat: number;
  lng: number;
  accuracy?: number | null;
};

function distanceFor(ticket: { lat: number | null; lng: number | null } | null, lat: number, lng: number) {
  if (!ticket || ticket.lat == null || ticket.lng == null) return null;
  return metersToFeet(haversineMeters(lat, lng, ticket.lat, ticket.lng));
}

export const pingGps = createServerFn({ method: "POST" })
  .validator((d: GpsInput) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    const sql = await getSql();
    const ticket = data.ticketId ? await loadTicketById(data.ticketId, profile.settings.gpsRadiusFt) : null;
    const open = await sql.query<EntryRow>(
      `select te.*, t.ticket_number from time_entries te
       left join tickets t on t.id = te.ticket_id
       where te.employee_id = $1 and te.clock_out is null
       order by te.clock_in desc limit 1`,
      [profile.employee.id],
    );
    const clockedIn = Boolean(open[0] && open[0].kind === "work");
    const distanceFt = distanceFor(ticket, data.lat, data.lng);
    const last = await sql<{ status: string }>`
      select status from gps_events where employee_id = ${profile.employee.id}
      order by recorded_at desc limit 1
    `;
    const status = resolveGpsStatus({
      hasFix: true,
      distanceFt,
      radiusFt: ticket?.gpsRadiusFt ?? profile.settings.gpsRadiusFt,
      approachingMultiplier: profile.settings.approachingMultiplier,
      clockedIn,
      previouslyOnSite: last[0]?.status === "WORKING" || last[0]?.status === "ON_SITE",
    });
    await sql`
      insert into gps_events (
        id, company_id, employee_id, ticket_id, lat, lng, accuracy, distance_ft, status
      ) values (
        ${newId("gps")}, ${profile.employee.companyId}, ${profile.employee.id},
        ${data.ticketId ?? open[0]?.ticket_id ?? null}, ${data.lat}, ${data.lng},
        ${data.accuracy ?? null}, ${distanceFt}, ${status}
      )
    `;
    if (status === "LEFT_SITE" && ticket) {
      const existing = await sql<{ id: string }>`
        select id from exceptions
        where employee_id = ${profile.employee.id} and ticket_id = ${ticket.id}
          and kind = 'left_site' and status = 'open' limit 1
      `;
      if (!existing[0]) {
        await sql`
          insert into exceptions (id, company_id, employee_id, ticket_id, kind, severity, message, status)
          values (
            ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket.id},
            'left_site', 'warning',
            ${`Device is ${Math.round(distanceFt ?? 0)} ft from job-site radius (${ticket.gpsRadiusFt} ft).`},
            'open'
          )
        `;
      }
    }
    return { status, distanceFt, trackingActive: true };
  });

export const clockIn = createServerFn({ method: "POST" })
  .validator((d: GpsInput & { ticketId: string; kind?: TimeKind }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    const sql = await getSql();
    const ticket = await loadTicketById(data.ticketId, profile.settings.gpsRadiusFt);
    if (!ticket) throw new Error("Ticket not found");
    const open = await sql<{ id: string }>`
      select id from time_entries where employee_id = ${profile.employee.id} and clock_out is null
    `;
    if (open[0]) throw new Error("Already clocked in. Clock out first.");
    const distanceFt = distanceFor(ticket, data.lat, data.lng);
    const status = resolveGpsStatus({
      hasFix: true,
      distanceFt,
      radiusFt: ticket.gpsRadiusFt,
      approachingMultiplier: profile.settings.approachingMultiplier,
      clockedIn: true,
    });
    const id = newId("te");
    const now = new Date().toISOString();
    await sql`
      insert into time_entries (
        id, company_id, employee_id, ticket_id, kind, clock_in,
        clock_in_lat, clock_in_lng, clock_in_accuracy, clock_in_distance_ft,
        gps_status, original_clock_in, created_by
      ) values (
        ${id}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.ticketId},
        ${data.kind ?? "work"}, ${now}, ${data.lat}, ${data.lng}, ${data.accuracy ?? null},
        ${distanceFt}, ${status}, ${now}, ${context.userId}
      )
    `;
    await sql`update tickets set status = 'in_progress', updated_at = now() where id = ${data.ticketId}`;
    await sql`
      insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, distance_ft, status)
      values (${newId("gps")}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.ticketId},
        ${data.lat}, ${data.lng}, ${data.accuracy ?? null}, ${distanceFt}, ${status})
    `;
    if (distanceFt != null && distanceFt > ticket.gpsRadiusFt) {
      await sql`
        insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
        values (
          ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.ticketId}, ${id},
          'gps_mismatch', 'info',
          ${`Clock-in recorded ${Math.round(distanceFt)} ft from the job site (radius ${ticket.gpsRadiusFt} ft). GPS is evidence, not payroll truth.`},
          'open'
        )
      `;
    }
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "clock_in",
      entityType: "time_entry",
      entityId: id,
      ticketId: data.ticketId,
      newValue: { at: now, gpsStatus: status, distanceFt },
    });
    return { id, status, distanceFt };
  });

export const clockOut = createServerFn({ method: "POST" })
  .validator((d: GpsInput) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    const sql = await getSql();
    const open = await sql.query<EntryRow>(
      `select te.*, t.ticket_number from time_entries te
       left join tickets t on t.id = te.ticket_id
       where te.employee_id = $1 and te.clock_out is null
       order by te.clock_in desc limit 1`,
      [profile.employee.id],
    );
    if (!open[0]) throw new Error("Not currently clocked in.");
    const entry = open[0];
    const ticket = entry.ticket_id ? await loadTicketById(entry.ticket_id, profile.settings.gpsRadiusFt) : null;
    const distanceFt = distanceFor(ticket, data.lat, data.lng);
    const now = new Date().toISOString();
    const total = minutesBetween(entry.clock_in, now);
    const billable = entry.kind === "work" ? total : 0;
    const nonBillable = entry.kind === "work" ? 0 : entry.kind === "break" ? 0 : total;
    const status = resolveGpsStatus({
      hasFix: true,
      distanceFt,
      radiusFt: ticket?.gpsRadiusFt ?? profile.settings.gpsRadiusFt,
      approachingMultiplier: profile.settings.approachingMultiplier,
      clockedIn: false,
      previouslyOnSite: true,
    });
    await sql`
      update time_entries set
        clock_out = ${now},
        clock_out_lat = ${data.lat},
        clock_out_lng = ${data.lng},
        clock_out_accuracy = ${data.accuracy ?? null},
        clock_out_distance_ft = ${distanceFt},
        billable_minutes = ${billable},
        non_billable_minutes = ${nonBillable},
        gps_status = ${status},
        original_clock_out = coalesce(original_clock_out, ${now}),
        updated_at = now(),
        updated_by = ${context.userId}
      where id = ${entry.id}
    `;
    if (ticket) {
      const kind = discrepancyKind(
        billable / 60,
        ticket.expectedHours,
        profile.settings.exceptionToleranceMin,
        ticket.codes.length > 0,
      );
      if (kind) {
        const msg =
          kind === "under_billed"
            ? `Technician billable ${ (billable / 60).toFixed(2) }h vs invoice codes ${ticket.expectedHours.toFixed(2)}h.`
            : kind === "over_billed"
              ? `Invoice codes ${ticket.expectedHours.toFixed(2)}h vs recorded billable ${(billable / 60).toFixed(2)}h.`
              : "Billable time recorded with no labor code on the invoice.";
        await sql`
          insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
          values (
            ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket.id}, ${entry.id},
            ${kind}, 'warning', ${msg}, 'open'
          )
        `;
      }
    }
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "clock_out",
      entityType: "time_entry",
      entityId: entry.id,
      ticketId: entry.ticket_id,
      newValue: { at: now, minutes: Math.round(total), distanceFt, status },
    });
    return { minutes: total, status, distanceFt };
  });

export const submitNote = createServerFn({ method: "POST" })
  .validator((d: { ticketId?: string; message: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    const message = data.message.trim();
    if (!message) throw new Error("Note cannot be empty");
    const sql = await getSql();
    await sql`
      insert into exceptions (id, company_id, employee_id, ticket_id, kind, severity, message, status)
      values (
        ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.ticketId ?? null},
        'note', 'info', ${message}, 'open'
      )
    `;
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "submit_note",
      entityType: "exception",
      ticketId: data.ticketId,
      newValue: { message },
    });
    return { ok: true };
  });

export const setJobSiteToHere = createServerFn({ method: "POST" })
  .validator((d: { ticketId: string; lat: number; lng: number }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    assertManager(profile);
    const sql = await getSql();
    await sql`
      update tickets set lat = ${data.lat}, lng = ${data.lng}, updated_at = now(), updated_by = ${context.userId}
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "set_job_gps",
      entityType: "ticket",
      entityId: data.ticketId,
      ticketId: data.ticketId,
      newValue: { lat: data.lat, lng: data.lng },
      reason: "Admin set job-site coordinates from current device location",
    });
    return { ok: true };
  });

export const listPeople = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    assertManager(profile);
    const people = await listEmployees(profile.employee.companyId);
    return { profile, people };
  });
