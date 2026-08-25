import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { f as formatHours, p as formatMoney } from "./session.server-DEz6QvgN.mjs";
import { t as Card } from "./card-BAydSPMQ.mjs";
import { r as getPayroll } from "./api-ops-BFJsObFf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payroll-Bb6wNmgR.js
var import_jsx_runtime = require_jsx_runtime();
function PayrollPage() {
	const q = useQuery({
		queryKey: ["payroll"],
		queryFn: () => getPayroll()
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { rows, from, to } = q.data;
	const total = rows.reduce((s, r) => s + r.totalWages, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Payroll estimate"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"Week ",
					from,
					" – ",
					to,
					". Historical wage rates are retained. This is not a payroll processor."
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] uppercase tracking-wide text-subtle",
				children: "Estimated gross"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-3xl tabular",
				children: formatMoney(total)
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "min-w-[800px] w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-b border-border",
							children: [
								"Employee",
								"Reg",
								"OT",
								"Wages",
								"Billable",
								"Revenue",
								"Labor %",
								"Contribution"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: h
							}, h))
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/70 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-medium",
									children: r.employee.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted",
									children: [formatMoney(r.employee.hourlyWage), "/hr"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.regularHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.overtimeHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(r.totalWages)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.billableHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(r.totalRevenue)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: [Math.round(r.laborCostPct * 100), "%"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(r.contributionAfterLabor)
							})
						]
					}, r.employee.id)) })]
				})
			})
		]
	});
}
//#endregion
export { PayrollPage as component };
