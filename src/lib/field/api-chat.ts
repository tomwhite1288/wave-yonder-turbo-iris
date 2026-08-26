import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/field/shop-middleware";
import { getSql, persistPgliteNow } from "@/lib/db";
import { newId } from "@/lib/utils";
import { requireProfile } from "./session.server";

async function ensureChat() {
  const sql = await getSql();
  await sql.query(`create table if not exists shop_messages (
    id text primary key, company_id text not null, from_id text not null, to_id text,
    body text not null, created_at timestamptz not null default now(), read_at timestamptz
  )`);
  await sql.query(`create table if not exists shop_alerts (
    id text primary key, company_id text not null, employee_id text, kind text not null,
    title text not null, body text not null, created_at timestamptz not null default now(), read_at timestamptz
  )`);
  return sql;
}

export const listInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    const sql = await ensureChat();
    const messages = await sql<{
      id: string;
      from_id: string;
      to_id: string | null;
      body: string;
      created_at: string;
      from_name: string;
    }>`
      select m.id, m.from_id, m.to_id, m.body, m.created_at::text, trim(e.first_name || ' ' || e.last_name) as from_name
      from shop_messages m
      left join employees e on e.id = m.from_id
      where m.company_id = ${profile.employee.companyId}
        and (m.to_id is null or m.to_id = ${profile.employee.id} or m.from_id = ${profile.employee.id})
      order by m.created_at desc
      limit 80
    `;
    const alerts = await sql<{ id: string; kind: string; title: string; body: string; created_at: string; read_at: string | null }>`
      select id, kind, title, body, created_at::text, read_at::text
      from shop_alerts
      where company_id = ${profile.employee.companyId}
        and (employee_id is null or employee_id = ${profile.employee.id})
      order by created_at desc
      limit 40
    `;
    const unread = alerts.filter((a) => !a.read_at).length + messages.filter((m) => m.to_id === profile.employee.id).length;
    return { profile, messages: messages.reverse(), alerts, unread };
  });

export const sendShopMessage = createServerFn({ method: "POST" })
  .validator((d: { body: string; toId?: string | null }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    const body = data.body.trim();
    if (!body) throw new Error("Message is empty");
    const sql = await ensureChat();
    await sql`
      insert into shop_messages (id, company_id, from_id, to_id, body)
      values (${newId("msg")}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.toId ?? null}, ${body})
    `;
    await persistPgliteNow();
    return { ok: true as const };
  });

export const markAlertsRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await requireProfile(context.userId);
    const sql = await ensureChat();
    await sql`
      update shop_alerts set read_at = now()
      where company_id = ${profile.employee.companyId}
        and (employee_id is null or employee_id = ${profile.employee.id})
        and read_at is null
    `;
    return { ok: true as const };
  });
