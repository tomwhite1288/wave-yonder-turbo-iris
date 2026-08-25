import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { _ as formatHours, h as formatClock } from "./session.server-DT32kkW4.mjs";
import { t as Badge } from "./badge-C3qa10Sn.mjs";
import { o as listJobs } from "./api-D-PkeQOG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/jobs-DbSggsdn.js
var import_jsx_runtime = require_jsx_runtime();
function JobsPage() {
	const q = useQuery({
		queryKey: ["jobs"],
		queryFn: () => listJobs()
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { tickets, profile } = q.data;
	const tz = profile.settings.timezone;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: "Jobs"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Ticket numbers from the primary platform or work orders created on the dispatch desk."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 md:grid-cols-2",
			children: tickets.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/app/jobs/$ticketId",
				params: { ticketId: t.id },
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-mono text-primary",
							children: ["#", t.ticketNumber]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: t.status === "in_progress" ? "ok" : t.status === "complete" ? "neutral" : "info",
							children: t.status.replaceAll("_", " ")
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-medium",
						children: t.customerName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm text-muted",
						children: [
							t.addressLine,
							", ",
							t.city
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex justify-between text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.technicianName ?? "Unassigned" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatClock(t.scheduledStart, tz) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 font-mono text-xs text-subtle",
						children: [
							"Codes ",
							t.codes.map((c) => c.code).join("+") || "—",
							" · ",
							formatHours(t.expectedHours),
							"h expected"
						]
					})
				]
			}, t.id))
		})]
	});
}
//#endregion
export { JobsPage as component };
