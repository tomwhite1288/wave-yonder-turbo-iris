const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-sync-key, x-field-key",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

const mem = globalThis.__fieldLedgerPush__ ?? (globalThis.__fieldLedgerPush__ = new Map());

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const key = (req.headers.get("x-sync-key") || req.headers.get("x-field-key") || "").trim();
  if (key.length < 6) return json({ error: "Company key required" }, 401);
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const body = await req.json();
  const action = body.action;
  const storeKey = "push:" + key;
  if (action === "subscribe" && body.subscription?.endpoint) {
    const all = mem.get(storeKey) || {};
    const user = body.user || body.fromUser || "office";
    const list = Array.isArray(all[user]) ? all[user] : [];
    const next = list.filter((s) => s.endpoint !== body.subscription.endpoint);
    next.push({ ...body.subscription, device: body.deviceName || "", at: Date.now() });
    all[user] = next.slice(-4);
    mem.set(storeKey, all);
    return json({ ok: true, user });
  }
  if (action === "send") {
    const all = mem.get(storeKey) || {};
    const targets = [];
    if (body.toUser === "all" || body.toUser === "*shop*" || body.toUser === "shop") {
      for (const [user, subs] of Object.entries(all)) {
        if (user === body.fromUser) continue;
        for (const sub of subs || []) targets.push(sub);
      }
    } else if (all[body.toUser]) {
      targets.push(...all[body.toUser]);
    }
    return json({ sent: targets.length, results: targets.map(() => "queued") });
  }
  if (action === "backup") {
    mem.set("sync:" + key, { rev: Date.now(), at: Date.now(), data: body.data, actor: "backup" });
    return json({ ok: true });
  }
  return json({ error: "Unknown action" }, 400);
};

export const config = { path: "/api/push" };
