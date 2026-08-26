import { a as require_jsx_runtime, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { T as formatMoney, v as downloadText, w as formatHours } from "./session.server-BThkfVCN.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as getPayroll } from "./api-ops-DOOYjFmA.mjs";
import { r as exportWeekPack } from "./api-account-C7rcPmzy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payroll-rYX0M37L.js
var import_jsx_runtime = require_jsx_runtime();
function PayrollPage() {
	const q = useQuery({
		queryKey: ["payroll"],
		queryFn: () => getPayroll()
	});
	const exportMut = useMutation({
		mutationFn: () => exportWeekPack(),
		onSuccess: (pack) => {
			downloadText(`payroll-${pack.from}.csv`, pack.csv.payroll, "text/csv");
			downloadText(`field-ledger-${pack.from}.json`, JSON.stringify(pack.json, null, 2), "application/json");
			toast.success("Payroll files downloaded");
		},
		onError: (e) => toast.error(e.message)
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { rows, from, to, profile } = q.data;
	const total = rows.reduce((s, r) => s + r.totalWages, 0);
	const net = rows.reduce((s, r) => s + r.netPay, 0);
	const unpaid = rows.reduce((s, r) => s + r.unpaidHours, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-semibold tracking-tight",
					children: "Payroll"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						"Week ",
						from,
						" – ",
						to,
						". Wages only on GPS-backed in-transit, show, working, and office time. Estimate only — not a payroll processor. Tax: fed ",
						profile.settings.payrollFedPct,
						"% / DE",
						" ",
						profile.settings.payrollStatePct,
						"% / FICA ",
						profile.settings.payrollFicaPct,
						"%."
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					disabled: exportMut.isPending,
					onClick: () => exportMut.mutate(),
					children: "Export CSV + JSON"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: "Gross wages"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-2xl tabular",
						children: formatMoney(total)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: "Est. net"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-2xl tabular",
						children: formatMoney(net)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: "Unpaid clocked"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-mono text-2xl tabular",
						children: [formatHours(unpaid), "h"]
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "min-w-[980px] w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-b border-border",
							children: [
								"Employee",
								"Paid",
								"Unpaid",
								"Drive",
								"Show",
								"Work",
								"Office",
								"OT",
								"Gross",
								"Tax",
								"Net"
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
								children: formatHours(r.paidHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.unpaidHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.travelHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.showHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.workHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(r.officeHours)
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
								children: formatMoney(r.taxFed + r.taxState + r.taxFica)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(r.netPay)
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
