import { i as createServerFn } from "./ssr2.mjs";
import { D as getSql, K as verifyAdminCode, L as newId, O as hashAdminCode, V as requireProfile, X as writeSetting, Y as writeAudit, f as assertAdmin, j as listAdminEmails, l as addAdminEmail, q as verifyUnlockCode, t as DEFAULT_ADMIN_CODE, u as adminHintVisible } from "./session.server-BThkfVCN.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as shopMiddleware } from "./shop-middleware-By_PdWYR.mjs";
import { clearShopSession, setEmployeePin, setupOfficeLogin, shopLoginStatus, signInWithPin } from "./shop-session.server-CMUhym2s.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-admin-o3yoiHyS.js
async function ready(userId) {
	return requireProfile(userId);
}
var officeLogin_createServerFn_handler = createServerRpc({
	id: "a1986319a819eb849e60e05da5a43bd2386479b09f125ce5a9dddc0af0ca61fb",
	name: "officeLogin",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => officeLogin.__executeServer(opts));
var officeLogin = createServerFn({ method: "POST" }).validator((d) => d).handler(officeLogin_createServerFn_handler, async ({ data }) => {
	await signInWithPin(data.username, data.password);
	return { ok: true };
});
var shopStatus_createServerFn_handler = createServerRpc({
	id: "d3a357b4da8bc8d43e1c98f1bb15b65402402efa22db961d3f7ed87a851b6ab3",
	name: "shopStatus",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => shopStatus.__executeServer(opts));
var shopStatus = createServerFn({ method: "GET" }).handler(shopStatus_createServerFn_handler, async () => shopLoginStatus());
var setupShopLogin_createServerFn_handler = createServerRpc({
	id: "f6328df3aecd68446b0a6734ab73447982bdbb5532a54978e59b4558cb7f0c89",
	name: "setupShopLogin",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => setupShopLogin.__executeServer(opts));
var setupShopLogin = createServerFn({ method: "POST" }).validator((d) => d).handler(setupShopLogin_createServerFn_handler, async ({ data }) => {
	await setupOfficeLogin(data);
	return { ok: true };
});
var pinLogin_createServerFn_handler = createServerRpc({
	id: "d42996ad6d4ea6c4def463d676a6989f9cd08bec2321342b0f88bbfe8f547307",
	name: "pinLogin",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => pinLogin.__executeServer(opts));
var pinLogin = createServerFn({ method: "POST" }).validator((d) => d).handler(pinLogin_createServerFn_handler, async ({ data }) => {
	await signInWithPin(data.username, data.pin);
	return { ok: true };
});
var pinLogout_createServerFn_handler = createServerRpc({
	id: "b79adedaee0e06139cc25cac96d3373a7b879f19acf5ad28291f4c29ae376e04",
	name: "pinLogout",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => pinLogout.__executeServer(opts));
var pinLogout = createServerFn({ method: "POST" }).handler(pinLogout_createServerFn_handler, async () => {
	clearShopSession();
	return { ok: true };
});
var assignShopPin_createServerFn_handler = createServerRpc({
	id: "a5e3cf2657649f336674f20a071f2b91a89cc37d490b122ed603832251079077",
	name: "assignShopPin",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => assignShopPin.__executeServer(opts));
var assignShopPin = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(assignShopPin_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	assertAdmin(profile);
	await setEmployeePin(context.userId, data.employeeId, data.username, data.pin);
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: profile.employee.id,
		action: "assign_pin",
		entityType: "employee",
		entityId: data.employeeId
	});
	return { ok: true };
});
var createShopUser_createServerFn_handler = createServerRpc({
	id: "5c63cb67525d3035681d873181f82540477e0f63492a7cca1cdb6cfda1836d89",
	name: "createShopUser",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => createShopUser.__executeServer(opts));
var createShopUser = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(createShopUser_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	assertAdmin(profile);
	const first = data.firstName.trim();
	const last = data.lastName.trim();
	if (!first || !last) throw new Error("Name is required");
	const sql = await getSql();
	const id = newId("emp");
	const lastNum = await sql`
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
		entityId: id
	});
	const { persistPgliteNow } = await import("./session.server-BThkfVCN.mjs").then((n) => n.U).then((n) => n.q);
	await persistPgliteNow();
	return {
		id,
		employeeNumber: number
	};
});
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
var claimAdministrator = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(claimAdministrator_createServerFn_handler, async ({ context, data }) => {
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
var setAdminAccessCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(setAdminAccessCode_createServerFn_handler, async ({ context, data }) => {
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
var saveAdminEmails = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(saveAdminEmails_createServerFn_handler, async ({ context, data }) => {
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
var setEmployeeRole = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(setEmployeeRole_createServerFn_handler, async ({ context, data }) => {
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
var getAdminEmails = createServerFn({ method: "GET" }).middleware([shopMiddleware]).handler(getAdminEmails_createServerFn_handler, async ({ context }) => {
	const profile = await ready(context.userId);
	assertAdmin(profile);
	return { emails: await listAdminEmails(profile.employee.companyId) };
});
var setAccountStatus_createServerFn_handler = createServerRpc({
	id: "6ae0ad42dc995273e588da79a5d1588f97790137139aeaf56f2a1de5d52b2168",
	name: "setAccountStatus",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => setAccountStatus.__executeServer(opts));
var setAccountStatus = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(setAccountStatus_createServerFn_handler, async ({ context, data }) => {
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
var redeemUnlockCode_createServerFn_handler = createServerRpc({
	id: "9fd8a6cb98a2a2d1684fd065fa94a025a47256cfdea3802e62abc7dccc02be84",
	name: "redeemUnlockCode",
	filename: "src/lib/field/api-admin.ts"
}, (opts) => redeemUnlockCode.__executeServer(opts));
var redeemUnlockCode = createServerFn({ method: "POST" }).validator((d) => d).middleware([shopMiddleware]).handler(redeemUnlockCode_createServerFn_handler, async ({ context, data }) => {
	const profile = await ready(context.userId);
	const { readSetting } = await import("./session.server-BThkfVCN.mjs").then((n) => n.U).then((n) => n.H);
	const stored = await readSetting(profile.employee.companyId, "unlock_code_hash");
	if (!verifyUnlockCode(data.code, stored)) throw Object.assign(/* @__PURE__ */ new Error("That unlock code is not valid"), { status: 403 });
	const at = (/* @__PURE__ */ new Date()).toISOString();
	await writeSetting(profile.employee.companyId, "trial_unlocked", "true", context.userId);
	await writeSetting(profile.employee.companyId, "trial_unlocked_at", at, context.userId);
	await writeAudit({
		companyId: profile.employee.companyId,
		actorId: context.userId,
		actorName: profile.employee.name,
		action: "redeem_unlock",
		entityType: "settings",
		entityId: "trial_unlocked",
		reason: "Shop license code accepted"
	});
	return {
		ok: true,
		trial: (await ready(context.userId)).trial
	};
});
//#endregion
export { assignShopPin_createServerFn_handler, claimAdministrator_createServerFn_handler, createShopUser_createServerFn_handler, getAdminEmails_createServerFn_handler, getAdminLoginMeta_createServerFn_handler, officeLogin_createServerFn_handler, pinLogin_createServerFn_handler, pinLogout_createServerFn_handler, redeemUnlockCode_createServerFn_handler, saveAdminEmails_createServerFn_handler, setAccountStatus_createServerFn_handler, setAdminAccessCode_createServerFn_handler, setEmployeeRole_createServerFn_handler, setupShopLogin_createServerFn_handler, shopStatus_createServerFn_handler };
