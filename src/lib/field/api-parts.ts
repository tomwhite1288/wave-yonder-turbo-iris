import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { newId, num } from "@/lib/utils";
import { assertManager, requireProfile, writeAudit } from "./session.server";
import type { PartView, TruckItem } from "./types";

type PartRow = {
  id: string;
  part_number: string;
  manufacturer: string;
  description: string;
  category: string;
  subcategory: string;
  cost: number | string;
  sell_price: number | string;
  markup: number | string;
  vendor: string | null;
  stock_qty: number;
  warehouse_qty: number;
  keywords: string | null;
  aliases: string | null;
  active: boolean;
};

function mapPart(row: PartRow): PartView {
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
    active: row.active,
  };
}

export const searchParts = createServerFn({ method: "GET" })
  .validator((d: { q?: string; category?: string } | undefined) => d ?? {})
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    const sql = await getSql();
    const q = (data.q ?? "").trim().toLowerCase();
    const category = data.category ?? "";
    let rows: PartRow[];
    if (q && category) {
      rows = await sql.query<PartRow>(
        `select * from parts
         where company_id = $1 and active = true and category = $2
           and (
             lower(part_number) like $3 or lower(manufacturer) like $3
             or lower(description) like $3 or lower(coalesce(keywords,'')) like $3
             or lower(coalesce(aliases,'')) like $3 or lower(subcategory) like $3
           )
         order by category, subcategory, part_number`,
        [profile.employee.companyId, category, `%${q}%`],
      );
    } else if (q) {
      rows = await sql.query<PartRow>(
        `select * from parts
         where company_id = $1 and active = true
           and (
             lower(part_number) like $2 or lower(manufacturer) like $2
             or lower(description) like $2 or lower(coalesce(keywords,'')) like $2
             or lower(coalesce(aliases,'')) like $2 or lower(subcategory) like $2
           )
         order by category, subcategory, part_number`,
        [profile.employee.companyId, `%${q}%`],
      );
    } else if (category) {
      rows = await sql.query<PartRow>(
        `select * from parts where company_id = $1 and active = true and category = $2
         order by subcategory, part_number`,
        [profile.employee.companyId, category],
      );
    } else {
      rows = await sql.query<PartRow>(
        `select * from parts where company_id = $1 and active = true
         order by category, subcategory, part_number`,
        [profile.employee.companyId],
      );
    }
    return { profile, items: rows.map(mapPart) };
  });

export const getTruck = createServerFn({ method: "GET" })
  .validator((d: { employeeId?: string } | undefined) => d ?? {})
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    const employeeId =
      profile.employee.role === "technician"
        ? profile.employee.id
        : (data.employeeId ?? profile.employee.id);
    if (profile.employee.role === "technician" && employeeId !== profile.employee.id) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    const sql = await getSql();
    const rows = await sql.query<PartRow & { tid: string; vehicle: string; quantity: number; min_quantity: number }>(
      `select p.*, ti.id as tid, ti.vehicle, ti.quantity, ti.min_quantity
       from truck_inventory ti
       join parts p on p.id = ti.part_id
       where ti.employee_id = $1
       order by p.category, p.part_number`,
      [employeeId],
    );
    const items: TruckItem[] = rows.map((r) => ({
      id: r.tid,
      part: mapPart(r),
      vehicle: r.vehicle,
      quantity: r.quantity,
      minQuantity: r.min_quantity,
      needsReplenish: r.quantity < r.min_quantity,
    }));
    return { profile, items, employeeId };
  });

export const useTruckPart = createServerFn({ method: "POST" })
  .validator((d: { inventoryId: string; qty: number; ticketId?: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await requireProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{ id: string; employee_id: string; quantity: number; part_id: string }>`
      select id, employee_id, quantity, part_id from truck_inventory where id = ${data.inventoryId}
    `;
    const row = rows[0];
    if (!row) throw new Error("Truck item not found");
    if (profile.employee.role === "technician" && row.employee_id !== profile.employee.id) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    const qty = Math.max(1, Math.floor(data.qty));
    if (row.quantity < qty) throw new Error("Not enough quantity on the truck");
    await sql`update truck_inventory set quantity = quantity - ${qty}, updated_at = now() where id = ${row.id}`;
    await sql`
      insert into truck_movements (id, truck_inventory_id, ticket_id, qty_delta, reason, created_by)
      values (${newId("tm")}, ${row.id}, ${data.ticketId ?? null}, ${-qty}, 'used_on_ticket', ${context.userId})
    `;
    if (data.ticketId) {
      const part = await sql<{ cost: number | string; sell_price: number | string }>`
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
      newValue: { qty: -qty },
    });
    return { ok: true };
  });

export const replenishTruck = createServerFn({ method: "POST" })
  .validator((d: { inventoryId: string; qty: number }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
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
