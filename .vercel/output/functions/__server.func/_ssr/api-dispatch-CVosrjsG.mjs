import { i as createServerFn } from "./ssr2.mjs";
import { D as getSql, L as newId, M as listEmployees, V as requireProfile, Y as writeAudit, d as assertActive, m as assertManager } from "./session.server-BThkfVCN.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as shopMiddleware } from "./shop-middleware-By_PdWYR.mjs";
import { i as liveBoard, r as hydrateToday, s as loadTickets } from "./queries.server-CkA3omDT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-dispatch-CVosrjsG.js
async function desk(userId) {
	const profile = await requireProfile(userId);
	await hydrateToday(profile.employee.companyId);
	assertActive(profile);
	assertManager(profile);
	return profile;
}
var getDispatchDesk_createServerFn_handler = createServerRpc({
	id: "2cb077b075826fc62c2a2046f34f009aec2259f3dd93e7b65004bab2f89605b1",
	name: "getDispatchDesk",
	filename: "src/lib/field/api-dispatch.ts"
}, (opts) => getDispatchDesk.__executeServer(opts));
var getDispatchDesk = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(getDispatchDesk_createServerFn_handler, async ({ context }) => {
	const profile = await desk(context.userId);
	return {
		profile,
		tickets: await loadTickets(profile.employee.companyId, profile.settings.gpsRadiusFt),
		rows: await liveBoard(profile.employee.companyId, profile.settings),
		people: (await listEmployees(profile.employee.companyId, true)).filter((e) => e.role === "technician"),
		openExceptions: (await (await getSql())`
      select count(*)::int as c from exceptions
      where company_id = ${profile.employee.companyId} and status = 'open'
    `)[0]?.c ?? 0,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
});
var createWorkOrder_createServerFn_handler = createServerRpc({
	id: "985b56c598ab0bb9ada6869b000b9b30767b67dd3f62b4e00abfe7e9a9d38115",
	name: "createWorkOrder",
	filename: "src/lib/field/api-dispatch.ts"
}, (opts) => createWorkOrder.__executeServer(opts));
var createWorkOrder = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createWorkOrder_createServerFn_handler, async ({ context, data }) => {
	const profile = await desk(context.userId);
	const customer = data.customerName.trim();
	if (!customer) throw new Error("Customer is required");
	const sql = await getSql();
	let number = (data.ticketNumber ?? "").replace(/\D/g, "");
	if (!number) {
		const last = await sql`
        select ticket_number as n from tickets
        where company_id = ${profile.employee.companyId}
        order by created_at desc limit 1
      `;
		const prev = Number.parseInt((last[0]?.n ?? "700000").replace(/\D/g, ""), 10);
		number = String(Number.isFinite(prev) ? prev + 1 : 700001);
	}
	if ((await sql`
      select id from tickets where company_id = ${profile.employee.companyId} and ticket_number = ${number}
    `)[0]) throw new Error(`Ticket ${number} already exists`);
	const id = newId("tkt");
	const techId = data.technicianId || null;
	const status = techId ? "scheduled" : "scheduled";
	const jobKind = data.jobKind === "callback" || data.jobKind === "warranty" ? data.jobKind : "service";
	await sql.query("alter table tickets add column if not exists job_kind text not null default 'service'");
	await sql`
      insert into tickets (
        id, company_id, ticket_number, customer_name, address_line, city, state, zip,
        lat, lng, gps_radius_ft, scheduled_start, scheduled_end, technician_id,
        status, source, notes, work_detail, job_kind, created_by
      ) values (
        ${id}, ${profile.employee.companyId}, ${number}, ${customer},
        ${data.addressLine.trim() || "Address TBD"}, ${data.city?.trim() || "New Castle"},
        ${data.state?.trim() || "DE"}, ${data.zip?.trim() || "19720"},
        ${data.lat ?? null}, ${data.lng ?? null}, ${profile.settings.gpsRadiusFt},
        ${data.appointmentStart ?? null}, ${data.appointmentEnd ?? null}, ${techId},
        ${status}, 'manual', ${data.notes?.trim() || null}, ${data.workDetail?.trim() || null},
        ${jobKind}, ${context.userId}
      )
    `;
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "create_work_order",
		entityType: "ticket",
		entityId: id,
		ticketId: id,
		newValue: {
			ticketNumber: number,
			technicianId: techId,
			customer
		}
	});
	return {
		id,
		ticketNumber: number
	};
});
var assignWorkOrder_createServerFn_handler = createServerRpc({
	id: "d3708a2138e31fb9333cc476efff2821441fc5e1f8d9d51a0fc59853f20b379e",
	name: "assignWorkOrder",
	filename: "src/lib/field/api-dispatch.ts"
}, (opts) => assignWorkOrder.__executeServer(opts));
var assignWorkOrder = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(assignWorkOrder_createServerFn_handler, async ({ context, data }) => {
	const profile = await desk(context.userId);
	const sql = await getSql();
	const row = await sql`
      select id, technician_id, scheduled_start from tickets
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
	if (!row[0]) throw new Error("Work order not found");
	await sql`
      update tickets set
        technician_id = ${data.technicianId},
        scheduled_start = ${data.appointmentStart ?? row[0].scheduled_start},
        scheduled_end = ${data.appointmentEnd ?? null},
        status = case when ${data.technicianId} is null then 'scheduled' else 'scheduled' end,
        updated_at = now(),
        updated_by = ${context.userId}
      where id = ${data.ticketId}
    `;
	if (data.technicianId) try {
		await sql.query(`create table if not exists shop_alerts (
          id text primary key, company_id text not null, employee_id text, kind text not null,
          title text not null, body text not null, created_at timestamptz not null default now(), read_at timestamptz
        )`);
		await sql`
          insert into shop_alerts (id, company_id, employee_id, kind, title, body)
          values (
            ${newId("al")}, ${profile.employee.companyId}, ${data.technicianId}, 'ticket',
            'Ticket assigned',
            ${`A work order was assigned to you.`}
          )
        `;
	} catch {}
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: data.technicianId ? "assign_work_order" : "unassign_work_order",
		entityType: "ticket",
		entityId: data.ticketId,
		ticketId: data.ticketId,
		originalValue: { technicianId: row[0].technician_id },
		newValue: {
			technicianId: data.technicianId,
			appointmentStart: data.appointmentStart
		}
	});
	return { ok: true };
});
var setWorkOrderStatus_createServerFn_handler = createServerRpc({
	id: "2628ed0ee57d25c0004285cb4c83f358987d31a97985b87b6c3ea19506a35d87",
	name: "setWorkOrderStatus",
	filename: "src/lib/field/api-dispatch.ts"
}, (opts) => setWorkOrderStatus.__executeServer(opts));
var setWorkOrderStatus = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(setWorkOrderStatus_createServerFn_handler, async ({ context, data }) => {
	const profile = await desk(context.userId);
	if (!(/* @__PURE__ */ new Set([
		"scheduled",
		"in_progress",
		"complete"
	])).has(data.status)) throw new Error("Invalid status");
	await (await getSql())`
      update tickets set status = ${data.status}, updated_at = now(), updated_by = ${context.userId}
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
	return { ok: true };
});
var setTicketJobKind_createServerFn_handler = createServerRpc({
	id: "cb467f284b040d930ea04063216033a878e1c778b138d31eb44f8ec36f927c9f",
	name: "setTicketJobKind",
	filename: "src/lib/field/api-dispatch.ts"
}, (opts) => setTicketJobKind.__executeServer(opts));
var setTicketJobKind = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(setTicketJobKind_createServerFn_handler, async ({ context, data }) => {
	const profile = await desk(context.userId);
	const kind = data.jobKind === "callback" || data.jobKind === "warranty" ? data.jobKind : "service";
	const sql = await getSql();
	await sql.query("alter table tickets add column if not exists job_kind text not null default 'service'");
	await sql`
      update tickets set job_kind = ${kind}, updated_at = now(), updated_by = ${context.userId}
      where id = ${data.ticketId} and company_id = ${profile.employee.companyId}
    `;
	return { ok: true };
});
//#endregion
export { assignWorkOrder_createServerFn_handler, createWorkOrder_createServerFn_handler, getDispatchDesk_createServerFn_handler, setTicketJobKind_createServerFn_handler, setWorkOrderStatus_createServerFn_handler };
