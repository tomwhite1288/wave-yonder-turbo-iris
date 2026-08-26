import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as GPS_LABEL } from "./queries.server-CkA3omDT.mjs";
import { t as Badge } from "./badge-BgqgnlCo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-CK2L7Kdp.js
var import_jsx_runtime = require_jsx_runtime();
var tone = {
	WORKING: "ok",
	ON_SITE: "ok",
	AT_OFFICE: "info",
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
var exceptionTone = {
	under_billed: "warn",
	over_billed: "warn",
	missing_code: "warn",
	invalid_code: "warn",
	missing_time: "warn",
	unpaid_claim: "danger",
	payroll: "danger",
	left_site: "danger",
	gps_mismatch: "warn",
	office_mismatch: "danger",
	travel_mismatch: "warn",
	parts_over_allowance: "warn",
	late: "info",
	early: "info",
	overtime: "info",
	note: "neutral"
};
function ExceptionTone({ kind }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: exceptionTone[kind] ?? "info",
		children: kind.replaceAll("_", " ")
	});
}
//#endregion
export { GpsBadge as n, ExceptionTone as t };
