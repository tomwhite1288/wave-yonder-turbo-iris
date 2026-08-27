import { getSql } from "@/lib/db";

/** Mark the shop as live. Never wipe tickets, punches, or the code book. */
export async function hydrateToday(companyId: string): Promise<void> {
  const sql = await getSql();
  const flag = await sql<{ value: string }>`
    select value from settings where company_id = ${companyId} and key = 'hydrated_day'
  `;
  if (flag[0]?.value === "off") return;

  await sql`
    insert into settings (company_id, key, value, updated_at)
    values (${companyId}, 'hydrated_day', 'off', now())
    on conflict (company_id, key) do update set value = 'off', updated_at = now()
  `;
}
