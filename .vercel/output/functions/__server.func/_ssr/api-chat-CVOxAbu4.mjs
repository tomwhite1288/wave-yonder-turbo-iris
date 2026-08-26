import { i as createServerFn } from "./ssr2.mjs";
import { B as persistPgliteNow, D as getSql, L as newId, V as requireProfile } from "./session.server-BThkfVCN.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as shopMiddleware } from "./shop-middleware-By_PdWYR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-chat-CVOxAbu4.js
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
var listInbox_createServerFn_handler = createServerRpc({
	id: "edce3e406e325f865833a71c723b70f7a07144518086ae7209068815e22591f3",
	name: "listInbox",
	filename: "src/lib/field/api-chat.ts"
}, (opts) => listInbox.__executeServer(opts));
var listInbox = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(listInbox_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	const sql = await ensureChat();
	const messages = await sql`
      select m.id, m.from_id, m.to_id, m.body, m.created_at::text, trim(e.first_name || ' ' || e.last_name) as from_name
      from shop_messages m
      left join employees e on e.id = m.from_id
      where m.company_id = ${profile.employee.companyId}
        and (m.to_id is null or m.to_id = ${profile.employee.id} or m.from_id = ${profile.employee.id})
      order by m.created_at desc
      limit 80
    `;
	const alerts = await sql`
      select id, kind, title, body, created_at::text, read_at::text
      from shop_alerts
      where company_id = ${profile.employee.companyId}
        and (employee_id is null or employee_id = ${profile.employee.id})
      order by created_at desc
      limit 40
    `;
	const unread = alerts.filter((a) => !a.read_at).length + messages.filter((m) => m.to_id === profile.employee.id).length;
	return {
		profile,
		messages: messages.reverse(),
		alerts,
		unread
	};
});
var sendShopMessage_createServerFn_handler = createServerRpc({
	id: "082466ecd4a788d5deb735232c7f9b80ab19bab87ebdd2a5b7882ee2bf81d1cf",
	name: "sendShopMessage",
	filename: "src/lib/field/api-chat.ts"
}, (opts) => sendShopMessage.__executeServer(opts));
var sendShopMessage = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(sendShopMessage_createServerFn_handler, async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const body = data.body.trim();
	if (!body) throw new Error("Message is empty");
	await (await ensureChat())`
      insert into shop_messages (id, company_id, from_id, to_id, body)
      values (${newId("msg")}, ${profile.employee.companyId}, ${profile.employee.id}, ${data.toId ?? null}, ${body})
    `;
	await persistPgliteNow();
	return { ok: true };
});
var markAlertsRead_createServerFn_handler = createServerRpc({
	id: "2b365ce8160ddc2de3a3fb519d238b810397d5e22de5046b3c669346d71622cd",
	name: "markAlertsRead",
	filename: "src/lib/field/api-chat.ts"
}, (opts) => markAlertsRead.__executeServer(opts));
var markAlertsRead = createServerFn({ method: "POST" }).middleware([shopMiddleware]).handler(markAlertsRead_createServerFn_handler, async ({ context }) => {
	const profile = await requireProfile(context.userId);
	await (await ensureChat())`
      update shop_alerts set read_at = now()
      where company_id = ${profile.employee.companyId}
        and (employee_id is null or employee_id = ${profile.employee.id})
        and read_at is null
    `;
	return { ok: true };
});
//#endregion
export { listInbox_createServerFn_handler, markAlertsRead_createServerFn_handler, sendShopMessage_createServerFn_handler };
