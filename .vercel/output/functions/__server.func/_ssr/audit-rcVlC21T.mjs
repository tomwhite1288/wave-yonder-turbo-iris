import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { h as formatClock } from "./session.server-DT32kkW4.mjs";
import { c as listAudit } from "./api-ops-Bo8xhUq6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/audit-rcVlC21T.js
var import_jsx_runtime = require_jsx_runtime();
function AuditPage() {
	const q = useQuery({
		queryKey: ["audit"],
		queryFn: () => listAudit()
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { items, profile } = q.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: "Audit trail"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Original values, new values, actor, and reason."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "space-y-2",
			children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: item.actorName ?? "System"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: item.action.replaceAll("_", " ")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto font-mono text-xs text-subtle",
								children: formatClock(item.createdAt, profile.settings.timezone)
							})
						]
					}),
					item.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: item.reason
					}) : null,
					item.originalValue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-2 overflow-x-auto font-mono text-[11px] text-subtle",
						children: item.originalValue
					}) : null,
					item.newValue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-1 overflow-x-auto font-mono text-[11px] text-muted",
						children: item.newValue
					}) : null
				]
			}, item.id))
		})]
	});
}
//#endregion
export { AuditPage as component };
