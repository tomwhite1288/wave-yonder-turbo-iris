import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/field/shop-middleware";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
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
import { assertAdmin, requireProfile, writeAudit } from "./session.server";
import { verifyUnlockCode } from "./trial.server";
import {
  setupOfficeLogin,
  signInWithPin,
  shopLoginStatus,
  clearShopSession,
  setEmployeePin,
} from "./shop-session.server";

async function ready(userId: string) {
  return requireProfile(userId);
}

export const officeLogin = createServerFn({ method: "POST" })
  .validator((d: { username: string; password: string }) => d)
  .handler(async ({ data }) => {
    await signInWithPin(data.username, data.password);
    return { ok: true as const };
  });

export const shopStatus = createServerFn({ method: "GET" }).handler(async () => shopLoginStatus());

export const setupShopLogin = createServerFn({ method: "POST" })
  .validator((d: {
    username: string;
    pin: string;
    name?: string;
    unlockCode?: string;
    staff?: { role: Role; username: string; pin: string; name: string }[];
  }) => d)
  .handler(async ({ data }) => {
    await setupOfficeLogin(data);
    return { ok: true as const };
  });

export const pinLogin = createServerFn({ method: "POST" })
  .validator((d: { username: string; pin: string }) => d)
  .handler(async ({ data }) => {
    await signInWithPin(data.username, data.pin);
    return { ok: true as const };
  });

export const pinLogout = createServerFn({ method: "POST" }).handler(async () => {
  clearShopSession();
  return { ok: true as const };
});

export const assignShopPin = createServerFn({ method: "POST" })
  .validator((d: { employeeId: string; username: string; pin: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    assertAdmin(profile);
    await setEmployeePin(context.userId, data.employeeId, data.username, data.pin);
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: profile.employee.id,
      action: "assign_pin",
      entityType: "employee",
      entityId: data.employeeId,
    });
    return { ok: true as const };
  });

export const createShopUser = createServerFn({ method: "POST" })
  .validator((d: { firstName: string; lastName: string; role: Role; username: string; pin: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    assertAdmin(profile);
    const first = data.firstName.trim();
    const last = data.lastName.trim();
    if (!first || !last) throw new Error("Name is required");
    const sql = await getSql();
    const id = newId("emp");
    const lastNum = await sql<{ n: string }>`
      select employee_number as n from employees where company_id = ${profile.employee.companyId} order by created_at desc limit 1
    `;
    const next = Number.parseInt((lastNum[0]?.n ?? "E-300").replace(/\D/g, ""), 10);
    const number = `E-${Number.isFinite(next) ? next + 1 : 301}`;
    await sql`
      insert into employees (
        id, company_id, user_id, employee_number, first_name, last_name, email, role,
        department, labor_classification, pay_type, active, account_status
      ) values (
        ${id}, ${profile.employee.companyId}, ${id}, ${number},
        ${first}, ${last}, ${data.username.trim().toLowerCase() + "@maichlesedge.com"}, ${data.role},
        ${data.role === "technician" ? "Field" : "Operations"},
        ${data.role === "admin" ? "Administrator" : data.role === "manager" ? "Supervisor" : "Technician"},
        'hourly', true, 'active'
      )
    `;
    await setEmployeePin(context.userId, id, data.username, data.pin);
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: profile.employee.id,
      action: "create_user",
      entityType: "employee",
      entityId: id,
    });
    const { persistPgliteNow } = await import("@/lib/db");
    await persistPgliteNow();
    return { id, employeeNumber: number };
  });

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
          account_status = 'active',
          active = true,
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

export const setAccountStatus = createServerFn({ method: "POST" })
  .validator((d: { employeeId: string; status: "active" | "pending" | "disabled" }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    assertAdmin(profile);
    const sql = await getSql();
    const target = await sql<{ id: string; account_status: string; role: string }>`
      select id, account_status, role from employees
      where id = ${data.employeeId} and company_id = ${profile.employee.companyId}
    `;
    const row = target[0];
    if (!row) throw new Error("Employee not found");
    if (row.id === profile.employee.id && data.status !== "active") {
      throw new Error("You cannot disable your own administrator account");
    }
    await sql`
      update employees
      set account_status = ${data.status},
          active = ${data.status === "active"},
          updated_at = now(),
          updated_by = ${context.userId}
      where id = ${row.id}
    `;
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: data.status === "active" ? "approve_account" : "set_account_status",
      entityType: "employee",
      entityId: row.id,
      originalValue: { accountStatus: row.account_status },
      newValue: { accountStatus: data.status },
    });
    return { ok: true };
  });

export const redeemUnlockCode = createServerFn({ method: "POST" })
  .validator((d: { code: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const profile = await ready(context.userId);
    const { readSetting } = await import("./admin-auth.server");
    const stored = await readSetting(profile.employee.companyId, "unlock_code_hash");
    if (!verifyUnlockCode(data.code, stored)) {
      throw Object.assign(new Error("That unlock code is not valid"), { status: 403 });
    }
    const at = new Date().toISOString();
    await writeSetting(profile.employee.companyId, "trial_unlocked", "true", context.userId);
    await writeSetting(profile.employee.companyId, "trial_unlocked_at", at, context.userId);
    await writeAudit({
      companyId: profile.employee.companyId,
      actorId: context.userId,
      actorName: profile.employee.name,
      action: "redeem_unlock",
      entityType: "settings",
      entityId: "trial_unlocked",
      reason: "Shop license code accepted",
    });
    const next = await ready(context.userId);
    return { ok: true, trial: next.trial };
  });
