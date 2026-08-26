import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";

const cors: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-sync-key, x-field-key",
  "access-control-allow-methods": "GET, PUT, POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: cors });
}

export function syncKeyOf(request: Request) {
  return (request.headers.get("x-sync-key") || request.headers.get("x-field-key") || "").trim();
}

export async function readSync(key: string) {
  const sql = await getSql();
  const rows = await sql<{ rev: number; payload: unknown; actor: string | null; updated_at: string }>`
    select rev, payload, actor, updated_at from office_sync where sync_key = ${key}
  `;
  const row = rows[0];
  if (!row) return { rev: 0, at: 0, data: null as unknown };
  return { rev: Number(row.rev), at: new Date(row.updated_at).getTime(), data: row.payload, actor: row.actor };
}

export async function writeSync(key: string, body: { rev?: number; data?: unknown }, actor?: string) {
  const cur = await readSync(key);
  const nextRev = Math.max(cur.rev || 0, body.rev || 0) + 1;
  const payload = body.data ?? cur.data ?? {};
  const sql = await getSql();
  await sql`
    insert into office_sync (sync_key, rev, payload, actor, updated_at)
    values (${key}, ${nextRev}, ${JSON.stringify(payload)}::jsonb, ${actor ?? null}, now())
    on conflict (sync_key) do update set
      rev = excluded.rev, payload = excluded.payload, actor = excluded.actor, updated_at = now()
  `;
  return { rev: nextRev, at: Date.now(), data: payload, actor: actor ?? null };
}

export async function addPushSub(opts: {
  key: string;
  user: string;
  subscription: { endpoint: string; keys?: { p256dh?: string; auth?: string } };
  device?: string;
}) {
  const sql = await getSql();
  await sql`delete from push_subscriptions where endpoint = ${opts.subscription.endpoint}`;
  await sql`
    insert into push_subscriptions (id, sync_key, user_label, endpoint, p256dh, auth_secret, device)
    values (
      ${newId("ps")}, ${opts.key}, ${opts.user}, ${opts.subscription.endpoint},
      ${opts.subscription.keys?.p256dh ?? null}, ${opts.subscription.keys?.auth ?? null},
      ${opts.device ?? null}
    )
  `;
}

export async function listPushTargets(key: string, toUser: string, fromUser?: string) {
  const sql = await getSql();
  const rows = await sql<{ user_label: string; endpoint: string; p256dh: string | null; auth_secret: string | null }>`
    select user_label, endpoint, p256dh, auth_secret from push_subscriptions where sync_key = ${key}
  `;
  const all = toUser === "all" || toUser === "*shop*" || toUser === "shop";
  return rows.filter((r) => (all ? r.user_label !== fromUser : r.user_label === toUser));
}
