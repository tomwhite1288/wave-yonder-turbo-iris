import { r as createServerFn } from "./ssr.mjs";
import { A as requireProfile, N as writeAudit, O as newId, b as getSql, c as assertActive, u as assertManager, w as listEmployees } from "./session.server-DT32kkW4.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as authMiddleware } from "./middleware-B13c303a.mjs";
import { o as hydrateToday, s as liveBoard, u as loadTickets } from "./queries.server-C0KNibQt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-dispatch-B9UUqsmP.js
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
var getDispatchDesk = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getDispatchDesk_createServerFn_handler, async ({ context }) => {
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
var createWorkOrder = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(createWorkOrder_createServerFn_handler, async ({ context, data }) => {
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
	await sql`
      insert into tickets (
        id, company_id, ticket_number, customer_name, address_line, city, state, zip,
        lat, lng, gps_radius_ft, scheduled_start, scheduled_end, technician_id,
        status, source, notes, work_detail, created_by
      ) values (
        ${id}, ${profile.employee.companyId}, ${number}, ${customer},
        ${data.addressLine.trim() || "Address TBD"}, ${data.city?.trim() || "New Castle"},
        ${data.state?.trim() || "DE"}, ${data.zip?.trim() || "19720"},
        ${data.lat ?? null}, ${data.lng ?? null}, ${profile.settings.gpsRadiusFt},
        ${data.appointmentStart ?? null}, ${data.appointmentEnd ?? null}, ${techId},
        ${status}, 'manual', ${data.notes?.trim() || null}, ${data.workDetail?.trim() || null},
        ${context.userId}
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
var assignWorkOrder = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(assignWorkOrder_createServerFn_handler, async ({ context, data }) => {
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
var setWorkOrderStatus = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(setWorkOrderStatus_createServerFn_handler, async ({ context, data }) => {
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
//#endregion
export { assignWorkOrder_createServerFn_handler, createWorkOrder_createServerFn_handler, getDispatchDesk_createServerFn_handler, setWorkOrderStatus_createServerFn_handler };
