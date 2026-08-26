import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/field/shop-middleware";
import { getSql, persistPgliteNow } from "@/lib/db";
import { newId, num, todayIso } from "@/lib/utils";
import { haversineMeters, metersToFeet, resolveGpsStatus } from "./geo";
import { minutesBetween, discrepancyKind, evaluateClaim, settleMinutes } from "./calc";
import { recordGps, recordTicketPin } from "./durable.server";
import { settlePendingGps } from "./gps-confirm.server";

import {
  assertLicensed,
  assertManager,
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
import type { CompanySettings, TimeKind } from "./types";


async function ready(userId: string) {
  const profile = await requireProfile(userId);
  await hydrateToday(profile.employee.companyId);
  return profile;
}

async function readyLive(userId: string) {
  const profile = await ready(userId);
  assertLicensed(profile);
  return profile;
}

export const getSessionProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => ready(context.userId));

export const getLiveBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await readyLive(context.userId);
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
    const profile = await readyLive(context.userId);
    await settlePendingGps({
      companyId: profile.employee.companyId,
      employeeId: profile.employee.id,
      settings: profile.settings,
    });
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
    const profile = await readyLive(context.userId);
    const techId = profile.employee.role === "technician" ? profile.employee.id : undefined;
    const tickets = await loadTickets(profile.employee.companyId, profile.settings.gpsRadiusFt, techId);
    return { profile, tickets };
  });

export const getJob = createServerFn({ method: "GET" })
  .validator((ticketId: string) => ticketId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: ticketId }) => {
    const profile = await readyLive(context.userId);
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
    let receipts: {
      id: string;
      code: string | null;
      amount: number | string;
      vendor: string | null;
      notes: string | null;
      created_at: string;
    }[] = [];
    try {
      receipts = await sql`
        select id, code, amount, vendor, notes, created_at
        from job_receipts where ticket_id = ${ticketId} order by created_at desc
      `;
    } catch {
      receipts = [];
    }
    return {
      profile,
      ticket,
      entries: entries.map(mapEntry),
      parts: parts.map((p) => ({ ...p, unit_price: num(p.unit_price) })),
      exceptions,
      receipts: receipts.map((r) => ({
        id: r.id,
        ticketId,
        employeeId: "",
        code: r.code,
        amount: num(r.amount),
        vendor: r.vendor,
        notes: r.notes,
        createdAt: r.created_at,
      })),
    };
  });

type GpsInput = {
  ticketId?: string | null;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  kind?: TimeKind;
};

function distanceFor(ticket: { lat: number | null; lng: number | null } | null, lat: number, lng: number) {
  if (!ticket || ticket.lat == null || ticket.lng == null) return null;
  return metersToFeet(haversineMeters(lat, lng, ticket.lat, ticket.lng));
}

function officeDistance(settings: CompanySettings, lat: number, lng: number) {
  return metersToFeet(haversineMeters(lat, lng, settings.officeLat, settings.officeLng));
}

function statusAt(opts: {
  settings: CompanySettings;
  ticket: { lat: number | null; lng: number | null; gpsRadiusFt: number } | null;
  lat?: number | null;
  lng?: number | null;
  clockedIn: boolean;
  previouslyOnSite?: boolean;
  accuracy?: number | null;
}) {
  const hasFix = opts.lat != null && opts.lng != null && !(opts.lat === 0 && opts.lng === 0);
  const distanceFt = hasFix ? distanceFor(opts.ticket, opts.lat!, opts.lng!) : null;
  const officeFt = hasFix ? officeDistance(opts.settings, opts.lat!, opts.lng!) : null;
  const status = resolveGpsStatus({
    hasFix,
    distanceFt,
    radiusFt: opts.ticket?.gpsRadiusFt ?? opts.settings.gpsRadiusFt,
    approachingMultiplier: opts.settings.approachingMultiplier,
    clockedIn: opts.clockedIn,
    previouslyOnSite: opts.previouslyOnSite,
    officeDistanceFt: officeFt,
    officeRadiusFt: opts.settings.officeRadiusFt,
    accuracyM: opts.accuracy,
  });
  return { status, distanceFt, officeFt, hasFix };
}


export const pingGps = createServerFn({ method: "POST" })
  .validator((d: GpsInput) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await readyLive(context.userId);
    const sql = await getSql();
    const ticket = data.ticketId ? await loadTicketById(data.ticketId, profile.settings.gpsRadiusFt) : null;
    const open = await sql.query<EntryRow>(
      `select te.*, t.ticket_number from time_entries te
       left join tickets t on t.id = te.ticket_id
       where te.employee_id = $1 and te.clock_out is null
       order by te.clock_in desc limit 1`,
      [profile.employee.id],
    );
    const clockedIn = Boolean(open[0] && (open[0].kind === "work" || open[0].kind === "show" || open[0].kind === "travel" || open[0].kind === "office"));
    const last = await sql<{ status: string }>`
      select status from gps_events where employee_id = ${profile.employee.id}
      order by recorded_at desc limit 1
    `;
    const { status, distanceFt, officeFt } = statusAt({
      settings: profile.settings,
      ticket,
      lat: data.lat,
      lng: data.lng,
      clockedIn,
      previouslyOnSite: last[0]?.status === "WORKING" || last[0]?.status === "ON_SITE",
      accuracy: data.accuracy,
    });
    await sql`
      insert into gps_events (
        id, company_id, employee_id, ticket_id, lat, lng, accuracy, distance_ft, status
      ) values (
        ${newId("gps")}, ${profile.employee.companyId}, ${profile.employee.id},
        ${data.ticketId ?? open[0]?.ticket_id ?? null}, ${data.lat ?? null}, ${data.lng ?? null},
        ${data.accuracy ?? null}, ${distanceFt}, ${status}
      )
    `;
    if (data.lat != null && data.lng != null) {
      await recordGps({
        employeeId: profile.employee.id,
        lat: data.lat,
        lng: data.lng,
        accuracy: data.accuracy ?? null,
        ticketId: data.ticketId ?? open[0]?.ticket_id ?? null,
        status,
        distanceFt,
        at: new Date().toISOString(),
      });
    }
    await settlePendingGps({
      companyId: profile.employee.companyId,
      employeeId: profile.employee.id,
      settings: profile.settings,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy,
    });
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
    await persistPgliteNow();
    return { status, distanceFt, officeFt, trackingActive: true };
  });

export const clockIn = createServerFn({ method: "POST" })
  .validator((d: GpsInput) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await readyLive(context.userId);
    const sql = await getSql();
    const kind: TimeKind = data.kind ?? "work";
    const ticket = data.ticketId ? await loadTicketById(data.ticketId, profile.settings.gpsRadiusFt) : null;
    if (!ticket && kind !== "office" && kind !== "break" && kind !== "admin") {
      throw new Error("Pick a job before starting drive, show, or work.");
    }
    const open = await sql<{ id: string }>`
      select id from time_entries where employee_id = ${profile.employee.id} and clock_out is null
    `;
    if (open[0]) throw new Error("Already clocked in. Clock out or switch status first.");
    const { status, distanceFt } = statusAt({
      settings: profile.settings,
      ticket,
      lat: data.lat,
      lng: data.lng,
      clockedIn: kind === "work" || kind === "show",
      accuracy: data.accuracy,
    });
    const claim = evaluateClaim({ kind, gpsStatus: status, settings: profile.settings });
    const id = newId("te");
    const now = new Date().toISOString();
    await sql`
      insert into time_entries (
        id, company_id, employee_id, ticket_id, kind, clock_in,
        clock_in_lat, clock_in_lng, clock_in_accuracy, clock_in_distance_ft,
        gps_status, gps_backed, original_clock_in, created_by
      ) values (
        ${id}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket?.id ?? null},
        ${kind}, ${now}, ${data.lat}, ${data.lng}, ${data.accuracy ?? null},
        ${distanceFt}, ${status}, ${claim.gpsBacked}, ${now}, ${context.userId}
      )
    `;
    const confirmMin = profile.settings.gpsConfirmMin ?? 15;
    const until = new Date(Date.now() + confirmMin * 60_000).toISOString();
    await sql.query("alter table time_entries add column if not exists gps_confirm_until timestamptz");
    await sql.query("alter table time_entries add column if not exists gps_confirm_status text");
    await sql`
      update time_entries
      set gps_confirm_until = ${until},
          gps_confirm_status = ${claim.gpsBacked ? "confirmed" : "pending"}
      where id = ${id}
    `;
    if (ticket) {
      await sql`update tickets set status = 'in_progress', updated_at = now() where id = ${ticket.id}`;
    }
    await sql`
      insert into gps_events (id, company_id, employee_id, ticket_id, lat, lng, accuracy, distance_ft, status)
      values (${newId("gps")}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket?.id ?? null},
        ${data.lat ?? null}, ${data.lng ?? null}, ${data.accuracy ?? null}, ${distanceFt}, ${status})
    `;
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "clock_in",
      entityType: "time_entry",
      entityId: id,
      ticketId: ticket?.id ?? null,
      newValue: { at: now, kind, gpsStatus: status, distanceFt, gpsBacked: claim.gpsBacked, confirmMin },
    });
    await persistPgliteNow();
    return { id, status, distanceFt, gpsBacked: claim.gpsBacked, reason: claim.reason, confirmMin };
  });

export const clockOut = createServerFn({ method: "POST" })
  .validator((d: GpsInput) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await readyLive(context.userId);
    const sql = await getSql();
    await settlePendingGps({
      companyId: profile.employee.companyId,
      employeeId: profile.employee.id,
      settings: profile.settings,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy,
    });
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
    const { status, distanceFt } = statusAt({
      settings: profile.settings,
      ticket,
      lat: data.lat,
      lng: data.lng,
      clockedIn: false,
      previouslyOnSite: true,
      accuracy: data.accuracy,
    });
    const now = new Date().toISOString();
    const total = minutesBetween(entry.clock_in, now);
    const claim = evaluateClaim({ kind: entry.kind, gpsStatus: status, settings: profile.settings });
    const settled = settleMinutes(total, claim);
    let paid = settled.paid;
    let billable = settled.billable;
    if (
      profile.settings.paySoldHours &&
      ticket &&
      (entry.kind === "work" || entry.kind === "show") &&
      (claim.gpsBacked || entry.kind === "work")
    ) {
      const soldMin = ticket.expectedHours * 60;
      if (soldMin > paid) {
        paid = soldMin;
        billable = soldMin;
      }
    }
    await sql`
      update time_entries set
        clock_out = ${now},
        clock_out_lat = ${data.lat},
        clock_out_lng = ${data.lng},
        clock_out_accuracy = ${data.accuracy ?? null},
        clock_out_distance_ft = ${distanceFt},
        billable_minutes = ${billable},
        non_billable_minutes = ${settled.nonBillable},
        paid_minutes = ${paid},
        unpaid_minutes = ${Math.max(0, total - paid)},
        gps_backed = ${claim.gpsBacked},
        gps_status = ${status},
        original_clock_out = coalesce(original_clock_out, ${now}),
        updated_at = now(),
        updated_by = ${context.userId}
      where id = ${entry.id}
    `;
    if (ticket && !profile.settings.paySoldHours) {
      const onSiteHrs = (entry.kind === "work" || entry.kind === "show" ? paid : 0) / 60;
      const kind = discrepancyKind(
        onSiteHrs,
        ticket.expectedHours,
        profile.settings.exceptionToleranceMin,
        ticket.codes.length > 0,
      );
      if (kind) {
        const msg =
          kind === "under_billed"
            ? `On-site ${onSiteHrs.toFixed(2)}h vs invoice codes ${ticket.expectedHours.toFixed(2)}h on #${ticket.ticketNumber}.`
            : kind === "over_billed"
              ? `Invoice codes ${ticket.expectedHours.toFixed(2)}h vs on-site ${onSiteHrs.toFixed(2)}h on #${ticket.ticketNumber}.`
              : "On-site time recorded with no labor code on the ticket.";
        await sql`
          insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
          values (
            ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${ticket.id}, ${entry.id},
            ${kind}, 'warning', ${msg}, 'open'
          )
        `;
      }
    }
    if (!claim.paid && settled.unpaid > 1 && claim.reason) {
      await sql`
        insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
        values (
          ${newId("ex")}, ${profile.employee.companyId}, ${profile.employee.id}, ${entry.ticket_id}, ${entry.id},
          'unpaid_claim', 'warning', ${claim.reason}, 'open'
        )
      `;
    }
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "clock_out",
      entityType: "time_entry",
      entityId: entry.id,
      ticketId: entry.ticket_id,
      newValue: { at: now, minutes: Math.round(total), paid, unpaid: Math.max(0, total - paid), status },
    });
    await persistPgliteNow();
    return { minutes: total, paid, unpaid: Math.max(0, total - paid), status, distanceFt, gpsBacked: claim.gpsBacked };
  });

export const transitionClock = createServerFn({ method: "POST" })
  .validator((d: GpsInput) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await readyLive(context.userId);
    const sql = await getSql();
    const open = await sql<{ id: string }>`
      select id from time_entries where employee_id = ${profile.employee.id} and clock_out is null
    `;
    if (open[0]) {
      await clockOut({ data: { ...data } });
    }
    return clockIn({ data });
  });

export const submitNote = createServerFn({ method: "POST" })
  .validator((d: { ticketId?: string; message: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await readyLive(context.userId);
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
    const profile = await readyLive(context.userId);
    const sql = await getSql();
    const assigned = await sql<{ technician_id: string | null }>`
      select technician_id from tickets where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
    const techId = assigned[0]?.technician_id;
    if (profile.employee.role === "technician" && techId && techId !== profile.employee.id) {
      throw Object.assign(new Error("This job is not assigned to you"), { status: 403 });
    }
    await sql`
      update tickets set lat = ${data.lat}, lng = ${data.lng}, updated_at = now(), updated_by = ${context.userId}
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
    await recordTicketPin(data.ticketId, data.lat, data.lng);
    await persistPgliteNow();
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
    const { collapseShopPeople } = await import("./shop-session.server");
    await collapseShopPeople(profile.employee.companyId);
    const people = (await listEmployees(profile.employee.companyId)).filter((p) => p.accountStatus !== "disabled");
    return { profile, people };
  });
