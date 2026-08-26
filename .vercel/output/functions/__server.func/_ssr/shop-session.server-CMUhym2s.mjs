import { a as getCookie, o as getRequest, u as setCookie$1 } from "./ssr2.mjs";
import { B as persistPgliteNow, D as getSql, L as newId, O as hashAdminCode, P as mapEmployee, X as writeSetting, q as verifyUnlockCode } from "./session.server-BThkfVCN.mjs";
import { createHmac, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/shop-session.server-CMUhym2s.js
var COOKIE = "fl_sid";
var OFFICE_ID = "emp_pat";
var SEED_IDS = /* @__PURE__ */ new Set([
	"emp_pat",
	"emp_sarah",
	"emp_john",
	"emp_marcus",
	"emp_elena",
	"emp_derrick"
]);
var EMP_SELECT = `
  select e.*, (
    select pr.hourly_wage from pay_rates pr
    where pr.employee_id = e.id
      and pr.effective_from <= current_date
      and (pr.effective_to is null or pr.effective_to >= current_date)
    order by pr.effective_from desc
    limit 1
  ) as hourly_wage
  from employees e
`;
function secret() {
	return process.env.BETTER_AUTH_SECRET?.trim() || process.env.FIELD_UNLOCK_CODE?.trim() || "field-ledger-shop-cookie-v1";
}
function sign(token) {
	const body = Buffer.from(JSON.stringify(token), "utf8").toString("base64url");
	return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
function readToken(raw) {
	if (!raw || !raw.includes(".")) return null;
	const [body, mac] = raw.split(".");
	if (!body || !mac) return null;
	const expected = createHmac("sha256", secret()).update(body).digest("base64url");
	const a = Buffer.from(mac);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	try {
		const token = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
		if (!token?.id || !token.exp || token.exp < Date.now()) return null;
		return token;
	} catch {
		return null;
	}
}
function cookieSecure() {
	return (getRequest()?.url ?? "").startsWith("https://") || Boolean(process.env.NETLIFY);
}
function writeSession(token) {
	setCookie$1(COOKIE, sign(token), {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		secure: cookieSecure(),
		maxAge: 1209600
	});
}
function clearShopSession() {
	setCookie$1(COOKIE, "", {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		secure: cookieSecure(),
		maxAge: 0
	});
}
function peekShopToken() {
	return readToken(getCookie(COOKIE));
}
async function requireShopUser() {
	const token = peekShopToken();
	if (!token) throw Object.assign(/* @__PURE__ */ new Error("Sign in required"), { status: 401 });
	return token;
}
async function ensureShopColumns() {
	const sql = await getSql();
	await sql.query("alter table employees add column if not exists username text");
	await sql.query("alter table employees add column if not exists pin_hash text");
}
async function collapseDuplicatePeople(companyId) {
	const sql = await getSql();
	const rows = await sql.query(`select id, username, email, created_at::text as created_at from employees where company_id = $1`, [companyId]);
	const groups = /* @__PURE__ */ new Map();
	for (const row of rows) {
		const userKey = row.username?.trim().toLowerCase();
		const emailKey = row.email?.trim().toLowerCase();
		const key = userKey ? `u:${userKey}` : emailKey ? `e:${emailKey}` : "";
		if (!key) continue;
		const list = groups.get(key) ?? [];
		list.push(row);
		groups.set(key, list);
	}
	for (const group of groups.values()) {
		if (group.length < 2) continue;
		const keeper = group.find((r) => r.id === OFFICE_ID) || group.find((r) => SEED_IDS.has(r.id)) || [...group].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))[0];
		if (!keeper) continue;
		for (const extra of group) {
			if (extra.id === keeper.id) continue;
			await sql`
        update employees
        set active = false,
            account_status = 'disabled',
            username = null,
            pin_hash = null,
            user_id = null,
            updated_at = now()
        where id = ${extra.id}
      `;
		}
	}
}
async function collapseShopPeople(companyId) {
	await ensureShopColumns();
	await collapseDuplicatePeople(companyId);
	await persistPgliteNow();
}
async function ensureOfficeAdmin(companyId) {
	const sql = await getSql();
	const existing = await sql.query(`${EMP_SELECT} where e.id = $1`, [OFFICE_ID]);
	if (existing[0]) return existing[0];
	await sql`
    insert into employees (
      id, company_id, user_id, employee_number, first_name, last_name, email, role,
      department, labor_classification, pay_type, active, account_status
    ) values (
      ${OFFICE_ID}, ${companyId}, ${OFFICE_ID}, 'E-100',
      'Pat', 'Maichle', 'pat@maichlesedge.com', 'admin',
      'Operations', 'Administrator', 'salary', true, 'active'
    )
    on conflict (id) do nothing
  `;
	return (await sql.query(`${EMP_SELECT} where e.id = $1`, [OFFICE_ID]))[0];
}
async function shopLoginStatus() {
	try {
		await ensureShopColumns();
		const sql = await getSql();
		const rows = await sql`
      select count(*)::int as c from employees
      where coalesce(username, '') <> '' and pin_hash is not null
    `;
		const names = await sql`
      select username from employees where coalesce(username, '') <> '' order by username
    `;
		return {
			needsSetup: Number(rows[0]?.c ?? 0) === 0,
			signedIn: Boolean(peekShopToken()),
			usernames: names.map((r) => r.username)
		};
	} catch {
		return {
			needsSetup: true,
			signedIn: Boolean(peekShopToken())
		};
	}
}
function validUsername(raw) {
	const v = raw.trim().toLowerCase();
	if (!/^[a-z0-9._-]{2,24}$/.test(v)) throw Object.assign(/* @__PURE__ */ new Error("Username: 2–24 letters, numbers, dot, dash"), { status: 400 });
	return v;
}
function validPin(raw) {
	const v = raw.trim();
	if (!/^\d{4,8}$/.test(v)) throw Object.assign(/* @__PURE__ */ new Error("PIN must be 4–8 digits"), { status: 400 });
	return v;
}
async function issueForEmployee(row, username) {
	const emp = mapEmployee(row);
	writeSession({
		id: emp.id,
		username,
		name: emp.name,
		role: emp.role,
		exp: Date.now() + 12096e5
	});
	return emp;
}
async function setupOfficeLogin(input) {
	const username = validUsername(input.username);
	const pin = validPin(input.pin);
	await ensureShopColumns();
	const sql = await getSql();
	const companyId = (await sql`select id from companies order by created_at asc limit 1`)[0]?.id ?? "co_maichles";
	await collapseDuplicatePeople(companyId);
	if ((await sql`
    select id from employees
    where lower(username) = ${username} and id <> ${OFFICE_ID} and coalesce(active, true) = true
    limit 1
  `)[0]) throw Object.assign(/* @__PURE__ */ new Error("That username is already assigned in People. Sign in with it, or pick another."), { status: 400 });
	const names = (input.name?.trim() || "Pat Maichle").split(/\s+/);
	await ensureOfficeAdmin(companyId);
	await sql`
    update employees
    set username = ${username},
        pin_hash = ${hashAdminCode(pin)},
        user_id = ${OFFICE_ID},
        account_status = 'active',
        active = true,
        role = 'admin',
        first_name = ${names[0] || "Pat"},
        last_name = ${names.slice(1).join(" ") || "Maichle"},
        updated_at = now()
    where id = ${OFFICE_ID}
  `;
	await sql`
    update employees
    set username = null,
        pin_hash = null,
        user_id = null,
        active = false,
        account_status = 'disabled'
    where company_id = ${companyId}
      and id <> ${OFFICE_ID}
      and lower(coalesce(username, '')) = ${username}
  `;
	const code = input.unlockCode?.trim() ?? "";
	if (code) {
		const stored = await sql`
      select value from settings where company_id = ${companyId} and key = 'unlock_code_hash' limit 1
    `;
		if (!verifyUnlockCode(code, stored[0]?.value)) throw Object.assign(/* @__PURE__ */ new Error("That activation code is not valid. Leave it blank to start a 7-day demo."), { status: 403 });
		await writeSetting(companyId, "trial_unlocked", "true", OFFICE_ID);
		await writeSetting(companyId, "trial_unlocked_at", (/* @__PURE__ */ new Date()).toISOString(), OFFICE_ID);
	} else {
		await writeSetting(companyId, "trial_unlocked", "false", OFFICE_ID);
		await writeSetting(companyId, "trial_days", "7", OFFICE_ID);
	}
	for (const person of input.staff ?? []) {
		const u = validUsername(person.username);
		const p = validPin(person.pin);
		const parts = person.name.trim().split(/\s+/);
		if (!parts[0]) continue;
		const id = newId("emp");
		const lastNum = await sql`
      select employee_number as n from employees where company_id = ${companyId} order by created_at desc limit 1
    `;
		const next = Number.parseInt((lastNum[0]?.n ?? "E-300").replace(/\D/g, ""), 10);
		const number = `E-${Number.isFinite(next) ? next + 1 : 301}`;
		const role = person.role === "manager" || person.role === "technician" ? person.role : "technician";
		await sql`
      insert into employees (
        id, company_id, user_id, employee_number, first_name, last_name, email, role,
        department, labor_classification, pay_type, active, account_status, username, pin_hash
      ) values (
        ${id}, ${companyId}, ${id}, ${number},
        ${parts[0]}, ${parts.slice(1).join(" ") || role},
        ${u + "@maichlesedge.com"}, ${role},
        ${role === "technician" ? "Field" : "Operations"},
        ${role === "manager" ? "Supervisor" : "Technician"},
        'hourly', true, 'active', ${u}, ${hashAdminCode(p)}
      )
    `;
	}
	await collapseDuplicatePeople(companyId);
	await persistPgliteNow();
	const row = (await sql.query(`${EMP_SELECT} where e.id = $1`, [OFFICE_ID]))[0];
	return issueForEmployee(row, username);
}
async function signInWithPin(usernameRaw, pinRaw) {
	const username = validUsername(usernameRaw);
	const pin = validPin(pinRaw);
	await ensureShopColumns();
	const sql = await getSql();
	const row = (await sql.query(`${EMP_SELECT} where lower(e.username) = $1 and e.pin_hash is not null and e.active = true limit 1`, [username]))[0];
	if (!row?.pin_hash) throw Object.assign(/* @__PURE__ */ new Error("Wrong username or PIN"), { status: 401 });
	const incoming = hashAdminCode(pin);
	const a = Buffer.from(incoming, "hex");
	const b = Buffer.from(row.pin_hash, "hex");
	if (a.length !== 32 || b.length !== 32 || !timingSafeEqual(a, b)) throw Object.assign(/* @__PURE__ */ new Error("Wrong username or PIN"), { status: 401 });
	if (row.account_status === "disabled") throw Object.assign(/* @__PURE__ */ new Error("This login is disabled"), { status: 403 });
	await sql`update employees set user_id = ${row.id}, updated_at = now() where id = ${row.id}`;
	await persistPgliteNow();
	return issueForEmployee(row, username);
}
async function setEmployeePin(actorId, employeeId, usernameRaw, pinRaw) {
	const username = validUsername(usernameRaw);
	const pin = validPin(pinRaw);
	const sql = await getSql();
	if ((await sql`
    select id from employees where lower(username) = ${username} and id <> ${employeeId} limit 1
  `)[0]) throw Object.assign(/* @__PURE__ */ new Error("That username is already used"), { status: 400 });
	await sql`
    update employees
    set username = ${username},
        pin_hash = ${hashAdminCode(pin)},
        user_id = coalesce(user_id, id),
        updated_at = now(),
        updated_by = ${actorId}
    where id = ${employeeId}
  `;
	await persistPgliteNow();
}
//#endregion
export { clearShopSession, collapseShopPeople, requireShopUser, setEmployeePin, setupOfficeLogin, shopLoginStatus, signInWithPin };
