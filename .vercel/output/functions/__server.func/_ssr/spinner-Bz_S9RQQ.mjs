import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/spinner-Bz_S9RQQ.js
var import_jsx_runtime = require_jsx_runtime();
function Spinner({ label = "Loading…" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-48 place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-3 text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-9 animate-spin rounded-full border-2 border-border border-t-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: label
			})]
		})
	});
}
//#endregion
export { Spinner as t };
