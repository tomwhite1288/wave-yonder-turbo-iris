import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { resolveGpsStatus } from "./geo";
import type { CompanySettings, GpsStatus, TimeKind } from "./types";
import { loadTicketById } from "./queries.server";
import { haversineMeters, metersToFeet } from "./geo";

function expectedOk(kind: TimeKind, status: GpsStatus) {
  if (kind === "work" || kind === "show") return status === "ON_SITE" || status === "WORKING";
  if (kind === "travel") return status === "APPROACHING" || status === "OFF_SITE" || status === "LEFT_SITE";
  if (kind === "office" || kind === "admin") return status === "AT_OFFICE";
  return true;
}

export async function settlePendingGps(opts: {
  companyId: string;
  employeeId: string;
  settings: CompanySettings;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
}) {
  const sql = await getSql();
  await sql.query("alter table time_entries add column if not exists gps_confirm_until timestamptz");
  await sql.query("alter table time_entries add column if not exists gps_confirm_status text");
  await sql.query(`create table if not exists shop_alerts (
    id text primary key,
    company_id text not null,
    employee_id text,
    kind text not null,
    title text not null,
    body text not null,
    created_at timestamptz not null default now(),
    read_at timestamptz
  )`);
  const rows = await sql.query<{
    id: string;
    kind: TimeKind;
    ticket_id: string | null;
    gps_confirm_until: string | null;
    gps_confirm_status: string | null;
  }>(
    `select id, kind, ticket_id, gps_confirm_until::text, gps_confirm_status
     from time_entries
     where employee_id = $1 and clock_out is null and coalesce(gps_confirm_status, 'pending') = 'pending'`,
    [opts.employeeId],
  );
  const now = Date.now();
  const confirmMin = Math.max(1, opts.settings.gpsConfirmMin ?? 15);
  for (const row of rows) {
    const ticket = row.ticket_id ? await loadTicketById(row.ticket_id, opts.settings.gpsRadiusFt) : null;
    const hasFix = opts.lat != null && opts.lng != null;
    const distanceFt =
      hasFix && ticket?.lat != null && ticket.lng != null
        ? metersToFeet(haversineMeters(opts.lat!, opts.lng!, ticket.lat, ticket.lng))
        : null;
    const officeFt =
      hasFix
        ? metersToFeet(haversineMeters(opts.lat!, opts.lng!, opts.settings.officeLat, opts.settings.officeLng))
        : null;
    const status = resolveGpsStatus({
      hasFix,
      distanceFt,
      radiusFt: ticket?.gpsRadiusFt ?? opts.settings.gpsRadiusFt,
      approachingMultiplier: opts.settings.approachingMultiplier,
      clockedIn: row.kind === "work" || row.kind === "show",
      officeDistanceFt: officeFt,
      officeRadiusFt: opts.settings.officeRadiusFt,
      accuracyM: opts.accuracy,
    });
    const deadline = row.gps_confirm_until ? Date.parse(row.gps_confirm_until) : now + confirmMin * 60000;
    if (hasFix && expectedOk(row.kind, status)) {
      await sql`
        update time_entries
        set gps_confirm_status = 'confirmed',
            gps_backed = true,
            gps_status = ${status},
            updated_at = now()
        where id = ${row.id}
      `;
      continue;
    }
    if (now > deadline) {
      await sql`
        update time_entries
        set gps_confirm_status = 'failed',
            gps_backed = false,
            approval_status = 'pending',
            updated_at = now()
        where id = ${row.id}
      `;
      const cond = opts.settings.payConditions?.[row.kind as "work" | "show" | "travel" | "office"];
      const shouldFlag =
        row.kind === "work"
          ? opts.settings.gpsFailFlagsWork !== false && (cond?.flagOnFail ?? true)
          : Boolean(cond?.flagOnFail);
      if (shouldFlag) {
        const existing = await sql<{ id: string }>`
          select id from exceptions
          where time_entry_id = ${row.id} and kind = 'gps_mismatch' and status = 'open' limit 1
        `;
        if (!existing[0]) {
          await sql`
            insert into exceptions (id, company_id, employee_id, ticket_id, time_entry_id, kind, severity, message, status)
            values (
              ${newId("ex")}, ${opts.companyId}, ${opts.employeeId}, ${row.ticket_id}, ${row.id},
              'gps_mismatch', 'warning',
              ${`GPS did not confirm ${row.kind} within ${confirmMin} min. Weekly timecard needs approval.`},
              'open'
            )
          `;
          await sql`
            insert into shop_alerts (id, company_id, employee_id, kind, title, body)
            values (
              ${newId("al")}, ${opts.companyId}, ${opts.employeeId}, 'gps',
              'GPS did not confirm',
              ${`A ${row.kind} punch was not GPS-backed in ${confirmMin} minutes.`}
            )
          `;
        }
      }
    }
  }
}
