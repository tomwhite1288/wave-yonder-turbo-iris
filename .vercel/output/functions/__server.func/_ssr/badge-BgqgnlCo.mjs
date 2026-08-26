import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { h as cn } from "./session.server-BThkfVCN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-BgqgnlCo.js
var import_jsx_runtime = require_jsx_runtime();
var tones = {
	neutral: "bg-elevated text-muted",
	ok: "bg-ok/15 text-ok",
	warn: "bg-warn/15 text-warn",
	danger: "bg-danger/15 text-danger",
	info: "bg-primary/15 text-primary"
};
function Badge({ className, tone = "neutral", children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase", tones[tone], className),
		children
	});
}
//#endregion
export { Badge as t };
