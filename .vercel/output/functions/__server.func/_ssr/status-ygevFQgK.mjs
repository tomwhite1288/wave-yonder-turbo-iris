import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as GPS_LABEL } from "./hydrate.server-GLJsv2Jg.mjs";
import { t as Badge } from "./badge-6Eox1gID.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-ygevFQgK.js
var import_jsx_runtime = require_jsx_runtime();
var tone = {
	WORKING: "ok",
	ON_SITE: "ok",
	APPROACHING: "warn",
	LEFT_SITE: "danger",
	OFF_SITE: "danger",
	OFFLINE: "neutral"
};
function GpsBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: tone[status],
		children: GPS_LABEL[status]
	});
}
function ExceptionTone({ kind }) {
	if (kind === "under_billed" || kind === "over_billed" || kind === "invalid_code") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: "warn",
		children: kind.replaceAll("_", " ")
	});
	if (kind === "left_site" || kind === "payroll") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: "danger",
		children: kind.replaceAll("_", " ")
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: "info",
		children: kind.replaceAll("_", " ")
	});
}
//#endregion
export { GpsBadge as n, ExceptionTone as t };
