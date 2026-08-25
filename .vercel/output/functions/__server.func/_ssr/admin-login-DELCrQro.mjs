//#region node_modules/.nitro/vite/services/ssr/assets/admin-login-DELCrQro.js
var ADMIN_CODE_KEY = "field-ledger.admin-code";
function stashAdminCode(code) {
	const value = code.trim();
	if (typeof window === "undefined" || !value) return;
	try {
		window.sessionStorage.setItem(ADMIN_CODE_KEY, value);
	} catch {}
}
function peekAdminCode() {
	if (typeof window === "undefined") return "";
	try {
		return window.sessionStorage.getItem("field-ledger.admin-code") ?? "";
	} catch {
		return "";
	}
}
function clearAdminCode() {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.removeItem(ADMIN_CODE_KEY);
	} catch {}
}
//#endregion
export { peekAdminCode as n, stashAdminCode as r, clearAdminCode as t };
