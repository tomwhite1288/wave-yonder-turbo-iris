import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { T as formatMoney, w as formatHours } from "./session.server-BThkfVCN.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Spinner } from "./spinner-Bz_S9RQQ.mjs";
import { n as getEfficiency } from "./api-ops-DOOYjFmA.mjs";
import { a as ResponsiveContainer, i as Bar, n as YAxis, o as Tooltip, r as XAxis, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/efficiency-CJiszQDv.js
var import_jsx_runtime = require_jsx_runtime();
function EfficiencyPage() {
	const q = useQuery({
		queryKey: ["efficiency"],
		queryFn: () => getEfficiency(),
		refetchInterval: 3e4
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { label: "Calculating sold vs available hours…" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { rows, from, to, profile } = q.data;
	const chart = rows.map((r) => ({
		name: r.employee.firstName,
		sold: Math.round(r.billableEfficiency * 100),
		job: Math.round(r.jobEfficiency * 100),
		util: Math.round(r.fieldUtilization * 100)
	}));
	const source = profile.settings.efficiencyAvailableSource === "clock" ? "clocked hours" : "scheduled 42.5h week";
	const companyPct = Math.round(rows.reduce((s, r) => s + r.soldHours, 0) / Math.max(rows.reduce((s, r) => s + r.availableHours, 0), .001) * 100);
	const target = profile.settings.efficiencyAlertPct || 80;
	const below = rows.filter((r) => r.availableHours >= 1 && r.billableEfficiency * 100 < target);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Billable efficiency"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"Week ",
					from,
					" – ",
					to,
					". Sold (code) hours ÷ available hours — not hourly wage. Finishing a 3-hour job in 2 still counts 3 sold hours. Alert fires below ",
					target,
					"%."
				]
			})] }),
			companyPct < target ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border border-warn/40 bg-warn/10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm font-medium",
					children: [
						"Company efficiency is ",
						companyPct,
						"% — below the ",
						target,
						"% target."
					]
				}), below.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: below.map((r) => `${r.employee.name} ${Math.round(r.billableEfficiency * 100)}%`).join(" · ")
				}) : null]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: "Company sold ÷ available"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-mono text-2xl tabular",
						children: [companyPct, "%"]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: "Sold hours"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-2xl tabular",
						children: formatHours(rows.reduce((s, r) => s + r.soldHours, 0))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: [
							"Available (",
							source,
							")"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-2xl tabular",
						children: formatHours(rows.reduce((s, r) => s + r.availableHours, 0))
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-56 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data: chart,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "name",
								stroke: "currentColor",
								className: "text-subtle",
								fontSize: 12,
								tickLine: false,
								axisLine: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								stroke: "currentColor",
								className: "text-subtle",
								fontSize: 12,
								tickLine: false,
								axisLine: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
								background: "var(--color-elevated)",
								border: "1px solid var(--color-border)",
								borderRadius: 8,
								color: "var(--color-fg)"
							} }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "sold",
								fill: "var(--color-primary)",
								radius: [
									6,
									6,
									0,
									0
								]
							})
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "min-w-[860px] w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-b border-border",
							children: [
								"Technician",
								"ST eff.",
								"Job eff.",
								"Util.",
								"Sold",
								"On site",
								"Drive",
								"Office",
								"Paid",
								"Rev / sold"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: h
							}, h))
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.slice().sort((a, b) => b.billableEfficiency - a.billableEfficiency).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/70 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-medium",
								children: r.employee.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: `px-4 py-3 font-mono tabular ${r.billableEfficiency * 100 < target ? "text-warn" : ""}`,
								children: [Math.round(r.billableEfficiency * 100), "%"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: [Math.round(r.jobEfficiency * 100), "%"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: [Math.round(r.fieldUtilization * 100), "%"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.soldHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.jobHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.driveHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.officeHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.paidHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(r.revenuePerBillableHour)
							})
						]
					}, r.employee.id)) })]
				})
			})
		]
	});
}
//#endregion
export { EfficiencyPage as component };
