import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { Role } from "./types";
import {
  addAdminEmail,
  adminHintVisible,
  DEFAULT_ADMIN_CODE,
  hashAdminCode,
  listAdminEmails,
  verifyAdminCode,
  writeSetting,
} from "./admin-auth.server";
import { assertAdmin, bootstrapProfile, writeAudit } from "./session.server";

async function ready(userId: string) {
  const sql = await getSql();
  const users = await sql.query<{ id: string; name: string; email: string }>(
    `select id, name, email from "user" where id = $1`,
    [userId],
  );
  const u = users[0];
  return bootstrapProfile({
    userId,
    email: u?.email ?? null,
    name: u?.name ?? null,
  });
}

export const getAdminLoginMeta = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const company = await sql<{ id: string }>`select id from companies order by created_at asc limit 1`;
  const companyId = company[0]?.id ?? "co_maichles";
  const hintVisible = await adminHintVisible(companyId);
  return {
    hintVisible,
    defaultCode: hintVisible ? DEFAULT_ADMIN_CODE : null,
  };
});

export const claimAdministrator = createServerFn({ method: "POST" })
  .validator((d: { code: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    const ok = await verifyAdminCode(profile.employee.companyId, data.code);
    if (!ok) {
      throw Object.assign(new Error("That administrator code is not valid"), { status: 403 });
    }
    if (profile.employee.role === "admin") {
      if (profile.employee.email) {
        await addAdminEmail(profile.employee.companyId, profile.employee.email, context.userId);
      }
      return { profile, alreadyAdmin: true };
    }
    const sql = await getSql();
    await sql`
      update employees
      set role = 'admin',
          department = case when department = 'Field' then 'Operations' else department end,
          labor_classification = case when labor_classification = 'Technician' then 'Administrator' else labor_classification end,
          updated_at = now(),
          updated_by = ${context.userId}
      where id = ${profile.employee.id} and company_id = ${profile.employee.companyId}
    `;
    if (profile.employee.email) {
      await addAdminEmail(profile.employee.companyId, profile.employee.email, context.userId);
    }
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "claim_admin",
      entityType: "employee",
      entityId: profile.employee.id,
      originalValue: { role: profile.employee.role },
      newValue: { role: "admin" },
      reason: "Unlocked with administrator access code",
    });
    const next = await ready(context.userId);
    return { profile: next, alreadyAdmin: false };
  });

export const setAdminAccessCode = createServerFn({ method: "POST" })
  .validator((d: { currentCode: string; nextCode: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    assertAdmin(profile);
    const currentOk = await verifyAdminCode(profile.employee.companyId, data.currentCode);
    if (!currentOk) throw new Error("Current administrator code is not correct");
    const next = data.nextCode.trim();
    if (next.length < 6) throw new Error("New code must be at least 6 characters");
    if (next.length > 64) throw new Error("New code is too long");
    await writeSetting(
      profile.employee.companyId,
      "admin_access_code_hash",
      hashAdminCode(next),
      context.userId,
    );
    await writeSetting(profile.employee.companyId, "admin_code_hint", "false", context.userId);
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "rotate_admin_code",
      entityType: "settings",
      entityId: "admin_access_code_hash",
      reason: "Administrator access code changed",
    });
    return { ok: true };
  });

export const saveAdminEmails = createServerFn({ method: "POST" })
  .validator((d: { emails: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    assertAdmin(profile);
    const cleaned = data.emails
      .split(/[\n,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.includes("@"));
    await writeSetting(profile.employee.companyId, "admin_emails", cleaned.join("\n"), context.userId);
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "update_admin_emails",
      entityType: "settings",
      entityId: "admin_emails",
      newValue: { emails: cleaned },
    });
    return { emails: cleaned };
  });

export const setEmployeeRole = createServerFn({ method: "POST" })
  .validator((d: { employeeId: string; role: Role }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    assertAdmin(profile);
    if (!["admin", "manager", "technician"].includes(data.role)) {
      throw new Error("Invalid role");
    }
    const sql = await getSql();
    const target = await sql<{ id: string; role: Role; email: string }>`
      select id, role, email from employees
      where id = ${data.employeeId} and company_id = ${profile.employee.companyId}
    `;
    const row = target[0];
    if (!row) throw new Error("Employee not found");
    if (row.id === profile.employee.id && data.role !== "admin") {
      const others = await sql<{ c: number }>`
        select count(*)::int as c from employees
        where company_id = ${profile.employee.companyId} and role = 'admin' and id <> ${row.id} and active = true
      `;
      if ((others[0]?.c ?? 0) < 1) {
        throw new Error("You are the last administrator — promote someone else first");
      }
    }
    await sql`
      update employees set role = ${data.role}, updated_at = now(), updated_by = ${context.userId}
      where id = ${row.id}
    `;
    if (data.role === "admin" && row.email) {
      await addAdminEmail(profile.employee.companyId, row.email, context.userId);
    }
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "set_role",
      entityType: "employee",
      entityId: row.id,
      originalValue: { role: row.role },
      newValue: { role: data.role },
    });
    return { ok: true };
  });

export const getAdminEmails = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await ready(context.userId);
    assertAdmin(profile);
    return { emails: await listAdminEmails(profile.employee.companyId) };
  });
