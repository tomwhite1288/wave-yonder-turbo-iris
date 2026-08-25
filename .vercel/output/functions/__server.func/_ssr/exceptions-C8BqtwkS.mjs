import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { h as formatClock } from "./session.server-DT32kkW4.mjs";
import { t as Button } from "./button-3OtcC0YW.mjs";
import { t as Badge } from "./badge-C3qa10Sn.mjs";
import { t as ExceptionTone } from "./status-CJXHZwrD.mjs";
import { f as resolveException, u as listExceptions } from "./api-ops-Bo8xhUq6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/exceptions-C8BqtwkS.js
var import_jsx_runtime = require_jsx_runtime();
function ExceptionsPage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["exceptions"],
		queryFn: () => listExceptions()
	});
	const mut = useMutation({
		mutationFn: resolveException,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["exceptions"] })
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { items, profile } = q.data;
	const can = profile.employee.role !== "technician";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: "Exceptions"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "GPS and invoice mismatches never silently change pay."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-2",
			children: items.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExceptionTone, { kind: x.kind }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: x.status === "open" ? "warn" : "neutral",
								children: x.status
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium",
								children: x.employeeName
							}),
							x.ticketId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/app/jobs/$ticketId",
								params: { ticketId: x.ticketId },
								className: "font-mono text-xs text-primary",
								children: ["#", x.ticketNumber]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto text-xs text-subtle",
								children: formatClock(x.createdAt, profile.settings.timezone)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: x.message
					}),
					can && x.status === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => mut.mutate({ data: {
								id: x.id,
								status: "acknowledged"
							} }),
							children: "Acknowledge"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => mut.mutate({ data: {
								id: x.id,
								status: "resolved"
							} }),
							children: "Resolve"
						})]
					}) : null
				]
			}, x.id))
		})]
	});
}
//#endregion
export { ExceptionsPage as component };
