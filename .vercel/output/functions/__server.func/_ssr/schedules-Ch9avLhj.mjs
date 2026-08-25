import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { a as getSchedules } from "./api-ops-BFJsObFf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/schedules-Ch9avLhj.js
var import_jsx_runtime = require_jsx_runtime();
var DAYS = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
];
function hm(min) {
	const h = Math.floor(min / 60);
	const m = min % 60;
	const am = h >= 12 ? "PM" : "AM";
	return `${(h + 11) % 12 + 1}:${m.toString().padStart(2, "0")} ${am}`;
}
function SchedulesPage() {
	const q = useQuery({
		queryKey: ["schedules"],
		queryFn: () => getSchedules()
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { people, rows } = q.data;
	const techs = people.filter((p) => p.role === "technician" || rows.some((r) => r.employee_id === p.id));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: "Schedules"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Compared against actual punches on the timecard."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "min-w-[720px] w-full text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "text-[11px] uppercase tracking-wide text-subtle",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3 font-medium",
							children: "Technician"
						}), DAYS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-3 font-medium",
							children: d
						}, d))]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: techs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border/70 last:border-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3 font-medium",
						children: p.name
					}), DAYS.map((_, day) => {
						const slot = rows.find((r) => r.employee_id === p.id && r.day_of_week === day);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-3 font-mono text-xs text-muted",
							children: slot ? `${hm(slot.start_minutes)}–${hm(slot.end_minutes)}` : "Off"
						}, day);
					})]
				}, p.id)) })]
			})
		})]
	});
}
//#endregion
export { SchedulesPage as component };
