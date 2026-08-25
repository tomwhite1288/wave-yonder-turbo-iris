import { r as createServerFn } from "./ssr.mjs";
import { C as listAdminEmails, M as verifyAdminCode, N as writeAudit, P as writeSetting, b as getSql, d as bootstrapProfile, l as assertAdmin, o as addAdminEmail, s as adminHintVisible, t as DEFAULT_ADMIN_CODE, x as hashAdminCode } from "./session.server-DT32kkW4.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as authMiddleware } from "./middleware-B13c303a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-admin-CFiDkuf9.js
async function ready(userId) {
	const u = (await (await getSql()).query(`select id, name, email from "user" where id = $1`, [userId]))[0];
	return bootstrapProfile({
		userId,
		email: u?.email ?? null,
		name: u?.name ?? null
	});
}
var getAdminLoginMeta_createServerFn_handler = createServerRpc({
	id: "27de1327f4dd795e5296b46546af7f5a461675a757187ee3e257dac6a8b827f9",
	name: "getAdminLoginMeta",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => getAdminLoginMeta.__executeServer(opts));
var getAdminLoginMeta = createServerFn({ method: "GET" }).handler(getAdminLoginMeta_createServerFn_handler, async () => {
	const companyId = (await (await getSql())`select id from companies order by created_at asc limit 1`)[0]?.id ?? "co_maichles";
	const hintVisible = await adminHintVisible(companyId);
	return {
		hintVisible,
		defaultCode: hintVisible ? DEFAULT_ADMIN_CODE : null
	};
});
var claimAdministrator_createServerFn_handler = createServerRpc({
	id: "a967907b1dd10518cc81d71b906848f97db5970184472e3b6c16c81405b815dd",
	name: "claimAdministrator",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => claimAdministrator.__executeServer(opts));
var claimAdministrator = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(claimAdministrator_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	if (!await verifyAdminCode(profile.employee.companyId, data.code)) throw Object.assign(/* @__PURE__ */ new Error("That administrator code is not valid"), { status: 403 });
	if (profile.employee.role === "admin") {
		if (profile.employee.email) await addAdminEmail(profile.employee.companyId, profile.employee.email, context.userId);
		return {
			profile,
			alreadyAdmin: true
		};
	}
	await (await getSql())`
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
	if (profile.employee.email) await addAdminEmail(profile.employee.companyId, profile.employee.email, context.userId);
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "claim_admin",
		entityType: "employee",
		entityId: profile.employee.id,
		originalValue: { role: profile.employee.role },
		newValue: { role: "admin" },
		reason: "Unlocked with administrator access code"
	});
	return {
		profile: await ready(context.userId),
		alreadyAdmin: false
	};
});
var setAdminAccessCode_createServerFn_handler = createServerRpc({
	id: "513c5da810d38bf60bc1c1c1762cac3a5c645f0ff3175a575d9ce242b6c31c14",
	name: "setAdminAccessCode",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => setAdminAccessCode.__executeServer(opts));
var setAdminAccessCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(setAdminAccessCode_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	assertAdmin(profile);
	if (!await verifyAdminCode(profile.employee.companyId, data.currentCode)) throw new Error("Current administrator code is not correct");
	const next = data.nextCode.trim();
	if (next.length < 6) throw new Error("New code must be at least 6 characters");
	if (next.length > 64) throw new Error("New code is too long");
	await writeSetting(profile.employee.companyId, "admin_access_code_hash", hashAdminCode(next), context.userId);
	await writeSetting(profile.employee.companyId, "admin_code_hint", "false", context.userId);
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "rotate_admin_code",
		entityType: "settings",
		entityId: "admin_access_code_hash",
		reason: "Administrator access code changed"
	});
	return { ok: true };
});
var saveAdminEmails_createServerFn_handler = createServerRpc({
	id: "fa2d82dd022fe8d3a0bd93251917f88141b79d3e32c0ae9b5d78fb7d01962b9c",
	name: "saveAdminEmails",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => saveAdminEmails.__executeServer(opts));
var saveAdminEmails = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(saveAdminEmails_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	assertAdmin(profile);
	const cleaned = data.emails.split(/[\n,;]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.includes("@"));
	await writeSetting(profile.employee.companyId, "admin_emails", cleaned.join("\n"), context.userId);
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "update_admin_emails",
		entityType: "settings",
		entityId: "admin_emails",
		newValue: { emails: cleaned }
	});
	return { emails: cleaned };
});
var setEmployeeRole_createServerFn_handler = createServerRpc({
	id: "f67b98a9f222a4a5c5d25407b7ac3f4cd6474a99343dc48121dfee203ab93e0e",
	name: "setEmployeeRole",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => setEmployeeRole.__executeServer(opts));
var setEmployeeRole = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(setEmployeeRole_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	assertAdmin(profile);
	if (![
		"admin",
		"manager",
		"technician"
	].includes(data.role)) throw new Error("Invalid role");
	const sql = await getSql();
	const row = (await sql`
      select id, role, email from employees
      where id = ${data.employeeId} and company_id = ${profile.employee.companyId}
    `)[0];
	if (!row) throw new Error("Employee not found");
	if (row.id === profile.employee.id && data.role !== "admin") {
		if (((await sql`
        select count(*)::int as c from employees
        where company_id = ${profile.employee.companyId} and role = 'admin' and id <> ${row.id} and active = true
      `)[0]?.c ?? 0) < 1) throw new Error("You are the last administrator — promote someone else first");
	}
	await sql`
      update employees set role = ${data.role}, updated_at = now(), updated_by = ${context.userId}
      where id = ${row.id}
    `;
	if (data.role === "admin" && row.email) await addAdminEmail(profile.employee.companyId, row.email, context.userId);
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "set_role",
		entityType: "employee",
		entityId: row.id,
		originalValue: { role: row.role },
		newValue: { role: data.role }
	});
	return { ok: true };
});
var getAdminEmails_createServerFn_handler = createServerRpc({
	id: "d4246a3e189493476e18caa56a91b82598b4a76507c306fd75d7e1266657e49a",
	name: "getAdminEmails",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => getAdminEmails.__executeServer(opts));
var getAdminEmails = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getAdminEmails_createServerFn_handler, async ({ context }) => {
	const profile = await ready(context.userId);
	assertAdmin(profile);
	return { emails: await listAdminEmails(profile.employee.companyId) };
});
var setAccountStatus_createServerFn_handler = createServerRpc({
	id: "6ae0ad42dc995273e588da79a5d1588f97790137139aeaf56f2a1de5d52b2168",
	name: "setAccountStatus",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => setAccountStatus.__executeServer(opts));
var setAccountStatus = createServerFn({ method: "POST" }).validator((d) => d).middleware([authMiddleware]).handler(setAccountStatus_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	assertAdmin(profile);
	const sql = await getSql();
	const row = (await sql`
      select id, account_status, role from employees
      where id = ${data.employeeId} and company_id = ${profile.employee.companyId}
    `)[0];
	if (!row) throw new Error("Employee not found");
	if (row.id === profile.employee.id && data.status !== "active") throw new Error("You cannot disable your own administrator account");
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
		newValue: { accountStatus: data.status }
	});
	return { ok: true };
});
//#endregion
export { claimAdministrator_createServerFn_handler, getAdminEmails_createServerFn_handler, getAdminLoginMeta_createServerFn_handler, saveAdminEmails_createServerFn_handler, setAccountStatus_createServerFn_handler, setAdminAccessCode_createServerFn_handler, setEmployeeRole_createServerFn_handler };
