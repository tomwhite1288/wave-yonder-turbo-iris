const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-sync-key, x-field-key",
  "access-control-allow-methods": "GET, PUT, OPTIONS",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

function blobsContext() {
  const raw = globalThis.netlifyBlobsContext || process.env.NETLIFY_BLOBS_CONTEXT || "";
  if (!raw) return null;
  const tryParse = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  let parsed = tryParse(raw);
  if (parsed && (parsed.siteID || parsed.token || parsed.edgeURL)) return parsed;
  try {
    parsed = tryParse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
  return parsed;
}

const mem = globalThis.__fieldLedgerSync__ ?? (globalThis.__fieldLedgerSync__ = new Map());

function blobUrls(ctx, key) {
  const store = "fieldledger";
  const path = `/${ctx.siteID}/${store}/${encodeURIComponent(key)}`;
  const headers = { authorization: `Bearer ${ctx.token}` };
  if (ctx.edgeURL) {
    const base = ctx.uncachedEdgeURL || ctx.edgeURL;
    return { url: new URL(path, base).toString(), headers, mode: "edge" };
  }
  const api = (ctx.apiURL || "https://api.netlify.com").replace(/\/$/, "");
  return { url: `${api}/api/v1/blobs${path}`, headers: { ...headers, accept: "application/json;type=signed-url" }, mode: "api" };
}

async function blobGet(key) {
  const ctx = blobsContext();
  if (!ctx?.siteID || !ctx?.token) return mem.get(key) ?? null;
  const req = blobUrls(ctx, key);
  if (req.mode === "edge") {
    const res = await fetch(req.url, { headers: req.headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("blob GET " + res.status);
    return res.json();
  }
  const sign = await fetch(req.url, { headers: req.headers, method: "GET" });
  if (sign.status === 404) return null;
  if (!sign.ok) throw new Error("blob sign GET " + sign.status);
  const { url } = await sign.json();
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("blob signed GET " + res.status);
  return res.json();
}

async function blobPut(key, value) {
  mem.set(key, value);
  const ctx = blobsContext();
  if (!ctx?.siteID || !ctx?.token) return;
  const body = JSON.stringify(value);
  const req = blobUrls(ctx, key);
  if (req.mode === "edge") {
    const res = await fetch(req.url, {
      method: "PUT",
      headers: { ...req.headers, "content-type": "application/json" },
      body,
    });
    if (!res.ok) throw new Error("blob PUT " + res.status);
    return;
  }
  const sign = await fetch(req.url, { headers: req.headers, method: "PUT" });
  if (!sign.ok) throw new Error("blob sign PUT " + sign.status);
  const { url } = await sign.json();
  const res = await fetch(url, { method: "PUT", headers: { "content-type": "application/json" }, body });
  if (!res.ok) throw new Error("blob signed PUT " + res.status);
}

function merge(a, b) {
  if (!a) return b;
  if (!b) return a;
  return { ...a, ...b };
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const key = (req.headers.get("x-sync-key") || req.headers.get("x-field-key") || "").trim();
  if (key.length < 6) return json({ error: "Company key required" }, 401);
  try {
    if (req.method === "GET") {
      const data = await blobGet(key);
      return json(data || { rev: 0, at: 0, data: null });
    }
    if (req.method === "PUT") {
      const body = await req.json();
      const cur = (await blobGet(key)) || { rev: 0, at: 0, data: null };
      const next = {
        rev: Math.max(cur.rev || 0, body.rev || 0) + 1,
        at: Date.now(),
        data: merge(cur.data, body.data),
        actor: "netlify",
      };
      await blobPut(key, next);
      return json(next);
    }
    return json({ error: "Method" }, 405);
  } catch (err) {
    return json({ error: String(err && err.message ? err.message : err) }, 500);
  }
};

export const config = { path: "/api/sync" };
