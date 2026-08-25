import { getSql } from "@/lib/db";

/** Demo tickets are no longer generated. One-time cleanup if an old flag remains. */
export async function hydrateToday(companyId: string): Promise<void> {
  const sql = await getSql();
  const flag = await sql<{ value: string }>`
    select value from settings where company_id = ${companyId} and key = 'hydrated_day'
  `;
  if (flag[0]?.value === "off") return;

  await sql`delete from gps_events where company_id = ${companyId} and (session_id like 'sess_%' or ticket_id like 'tkt_%')`;
  await sql`delete from truck_movements where ticket_id like 'tkt_%'`;
  await sql`delete from exceptions where id like 'ex_%' or ticket_id like 'tkt_%'`;
  await sql`delete from time_entries where id like 'te_%' or ticket_id like 'tkt_%'`;
  await sql`delete from ticket_codes where ticket_id like 'tkt_%'`;
  await sql`delete from ticket_parts where ticket_id like 'tkt_%'`;
  await sql`delete from tickets where id like 'tkt_%'`;
  await sql`delete from code_book where id like 'cb_%'`;

  await sql`
    insert into settings (company_id, key, value, updated_at)
    values (${companyId}, 'hydrated_day', 'off', now())
    on conflict (company_id, key) do update set value = 'off', updated_at = now()
  `;
}
