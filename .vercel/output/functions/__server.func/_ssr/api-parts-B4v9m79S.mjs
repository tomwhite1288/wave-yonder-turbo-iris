import { r as createServerFn } from "./ssr.mjs";
import { A as requireProfile, N as writeAudit, O as newId, b as getSql, k as num, u as assertManager } from "./session.server-DT32kkW4.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as authMiddleware } from "./middleware-B13c303a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-parts-B4v9m79S.js
function mapPart(row) {
	return {
		id: row.id,
		partNumber: row.part_number,
		manufacturer: row.manufacturer,
		description: row.description,
		category: row.category,
		subcategory: row.subcategory,
		cost: num(row.cost),
		sellPrice: num(row.sell_price),
		markup: num(row.markup),
		vendor: row.vendor,
		stockQty: row.stock_qty,
		warehouseQty: row.warehouse_qty,
		keywords: row.keywords,
		aliases: row.aliases,
		active: row.active
	};
}
var searchParts_createServerFn_handler = createServerRpc({
	id: "551116927a92bed51a1a62bb8838d679586249f152809936ba656c13cfd5665a",
	name: "searchParts",
	filename: "src/lib/field/api-parts.ts"
}, (opts) => searchParts.__executeServer(opts));
var searchParts = createServerFn({ method: "GET" }).validator((d) => d ?? {}).middleware([authMiddleware]).handler(searchParts_createServerFn_handler, async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const q = (data.q ?? "").trim().toLowerCase();
	const category = data.category ?? "";
	let rows;
	if (q && category) rows = await sql.query(`select * from parts
         where company_id = $1 and active = true and category = $2
           and (
             lower(part_number) like $3 or lower(manufacturer) like $3
             or lower(description) like $3 or lower(coalesce(keywords,'')) like $3
             or lower(coalesce(aliases,'')) like $3 or lower(subcategory) like $3
           )
         order by category, subcategory, part_number`, [
		profile.employee.companyId,
		category,
		`%${q}%`
	]);
	else if (q) rows = await sql.query(`select * from parts
         where company_id = $1 and active = true
           and (
             lower(part_number) like $2 or lower(manufacturer) like $2
             or lower(description) like $2 or lower(coalesce(keywords,'')) like $2
             or lower(coalesce(aliases,'')) like $2 or lower(subcategory) like $2
           )
         order by category, subcategory, part_number`, [profile.employee.companyId, `%${q}%`]);
	else if (category) rows = await sql.query(`select * from parts where company_id = $1 and active = true and category = $2
         order by subcategory, part_number`, [profile.employee.companyId, category]);
	else rows = await sql.query(`select * from parts where company_id = $1 and active = true
         order by category, subcategory, part_number`, [profile.employee.companyId]);
	return {
		profile,
		items: rows.map(mapPart)
	};
});
var getTruck_createServerFn_handler = createServerRpc({
	id: "c2c453b7b2852786da7f5acaa111bb98f392187270822d43c21f2f1d928403f6",
	name: "getTruck",
	filename: "src/lib/field/api-parts.ts"
}, (opts) => getTruck.__executeServer(opts));
var getTruck = createServerFn({ method: "GET" }).validator((d) => d ?? {}).middleware([authMiddleware]).handler(getTruck_createServerFn_handler, async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const employeeId = profile.employee.role === "technician" ? profile.employee.id : data.employeeId ?? profile.employee.id;
	if (profile.employee.role === "technician" && employeeId !== profile.employee.id) throw Object.assign(/* @__PURE__ */ new Error("Forbidden"), { status: 403 });
	return {
		profile,
		items: (await (await getSql()).query(`select p.*, ti.id as tid, ti.vehicle, ti.quantity, ti.min_quantity
       from truck_inventory ti
       join parts p on p.id = ti.part_id
       where ti.employee_id = $1
       order by p.category, p.part_number`, [employeeId])).map((r) => ({
			id: r.tid,
			part: mapPart(r),
			vehicle: r.vehicle,
			quantity: r.quantity,
			minQuantity: r.min_quantity,
			needsReplenish: r.quantity < r.min_quantity
		})),
		employeeId
	};
});
var useTruckPart_createServerFn_handler = createServerRpc({
	id: "4ae9066a8531e109d498e31c21cfb490728ac41bd3f62c6325fda9e42812c7d8",
	name: "useTruckPart",
	filename: "src/lib/field/api-parts.ts"
}, (opts) => useTruckPart.__executeServer(opts));
var useTruckPart = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(useTruckPart_createServerFn_handler, async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const row = (await sql`
      select id, employee_id, quantity, part_id from truck_inventory where id = ${data.inventoryId}
    `)[0];
	if (!row) throw new Error("Truck item not found");
	if (profile.employee.role === "technician" && row.employee_id !== profile.employee.id) throw Object.assign(/* @__PURE__ */ new Error("Forbidden"), { status: 403 });
	const qty = Math.max(1, Math.floor(data.qty));
	if (row.quantity < qty) throw new Error("Not enough quantity on the truck");
	await sql`update truck_inventory set quantity = quantity - ${qty}, updated_at = now() where id = ${row.id}`;
	await sql`
      insert into truck_movements (id, truck_inventory_id, ticket_id, qty_delta, reason, created_by)
      values (${newId("tm")}, ${row.id}, ${data.ticketId ?? null}, ${-qty}, 'used_on_ticket', ${context.userId})
    `;
	if (data.ticketId) {
		const part = await sql`
        select cost, sell_price from parts where id = ${row.part_id}
      `;
		await sql`
        insert into ticket_parts (id, ticket_id, part_id, quantity, unit_cost, unit_price)
        values (${newId("tp")}, ${data.ticketId}, ${row.part_id}, ${qty}, ${num(part[0]?.cost)}, ${num(part[0]?.sell_price)})
      `;
	}
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "use_truck_part",
		entityType: "truck_inventory",
		entityId: row.id,
		ticketId: data.ticketId,
		newValue: { qty: -qty }
	});
	return { ok: true };
});
var replenishTruck_createServerFn_handler = createServerRpc({
	id: "85db1286bf6ffaa2d8c89fd99ab26b893b8f56355e47ca989e30936e95144fc6",
	name: "replenishTruck",
	filename: "src/lib/field/api-parts.ts"
}, (opts) => replenishTruck.__executeServer(opts));
var replenishTruck = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(replenishTruck_createServerFn_handler, async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	assertManager(profile);
	const sql = await getSql();
	const qty = Math.max(1, Math.floor(data.qty));
	await sql`update truck_inventory set quantity = quantity + ${qty}, updated_at = now() where id = ${data.inventoryId}`;
	await sql`
      insert into truck_movements (id, truck_inventory_id, qty_delta, reason, created_by)
      values (${newId("tm")}, ${data.inventoryId}, ${qty}, 'replenish', ${context.userId})
    `;
	return { ok: true };
});
//#endregion
export { getTruck_createServerFn_handler, replenishTruck_createServerFn_handler, searchParts_createServerFn_handler, useTruckPart_createServerFn_handler };
