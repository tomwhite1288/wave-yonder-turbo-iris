import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { C as formatDuration, F as minutesBetween, S as formatClock, a as KIND_LABEL, v as downloadText, w as formatHours } from "./session.server-BThkfVCN.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Badge } from "./badge-BgqgnlCo.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as approveTimecard } from "./api-ops-DOOYjFmA.mjs";
import { i as getAccountabilityWeek, r as exportWeekPack } from "./api-account-C7rcPmzy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/timecards-Brwcrqh0.js
var import_jsx_runtime = require_jsx_runtime();
function TimecardsPage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["timecards"],
		queryFn: () => getAccountabilityWeek({ data: { offsetWeeks: 0 } })
	});
	const approve = useMutation({
		mutationFn: approveTimecard,
		onSuccess: () => {
			toast.success("Timecard approved");
			qc.invalidateQueries({ queryKey: ["timecards"] });
		}
	});
	const exportMut = useMutation({
		mutationFn: () => exportWeekPack(),
		onSuccess: (pack) => {
			downloadText(`timecards-${pack.from}.csv`, pack.csv.timecards, "text/csv");
			downloadText(`payroll-${pack.from}.csv`, pack.csv.payroll, "text/csv");
			downloadText(`jobs-${pack.from}.csv`, pack.csv.jobs, "text/csv");
			toast.success("Week files downloaded");
		},
		onError: (e) => toast.error(e.message)
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { rows, profile, from, to } = q.data;
	const tz = profile.settings.timezone;
	const canApprove = profile.employee.role !== "technician";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Timecards"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"Week ",
					from,
					" – ",
					to,
					". Paid time is GPS-backed in-transit, show, working, and office only. Cross-check punches against assigned invoices and coded hours."
				]
			})] }), canApprove ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "secondary",
				disabled: exportMut.isPending,
				onClick: () => exportMut.mutate(),
				children: "Download CSV"
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [rows.map((row) => {
				const paid = row.hours.paid / 60;
				const sold = row.soldHours;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-medium",
								children: row.employee.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs text-muted",
								children: [
									row.employee.employeeNumber,
									" · ",
									row.employee.department
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: row.card?.status === "approved" ? "ok" : "warn",
									children: row.card?.status ?? "open"
								}), canApprove ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "secondary",
									onClick: () => approve.mutate({ data: {
										employeeId: row.employee.id,
										workDate: from,
										note: "Verified punches vs invoices"
									} }),
									children: "Approve week"
								}) : null]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Paid",
									value: formatHours(paid),
									hint: "GPS-backed"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Unpaid",
									value: formatHours(row.hours.unpaid / 60),
									hint: "Not claimed"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "Sold / codes",
									value: formatHours(sold),
									hint: "Invoice allocation"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
									label: "ST efficiency",
									value: `${Math.round(row.efficiency.billableEfficiency * 100)}%`,
									hint: "Sold ÷ available"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mb-2 text-[11px] uppercase tracking-wide text-subtle",
							children: "Assigned invoices"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mb-4 space-y-1 text-sm",
							children: [row.jobs.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/app/jobs/$ticketId",
										params: { ticketId: j.id },
										className: "font-mono text-primary",
										children: ["#", j.ticketNumber]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate text-muted",
										children: j.customerName
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-xs",
										children: [
											j.codes.map((c) => c.code).join("+") || "no code",
											" · ",
											formatHours(j.expectedHours),
											"h"
										]
									})
								]
							}, j.id)), row.jobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-muted",
								children: "No invoices assigned this week."
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mb-2 text-[11px] uppercase tracking-wide text-subtle",
							children: "Punches"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "space-y-1 text-sm",
							children: [row.entries.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-24 text-muted",
										children: KIND_LABEL[e.kind] ?? e.kind
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-xs",
										children: ["#", e.ticketNumber ?? "—"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono tabular",
										children: [
											formatClock(e.clockIn, tz),
											"–",
											e.clockOut ? formatClock(e.clockOut, tz) : "open"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono tabular",
										children: formatDuration(minutesBetween(e.clockIn, e.clockOut))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: e.gpsBacked && e.paidMinutes > 0 ? "ok" : "warn",
										children: e.paidMinutes > 0 ? "paid" : "unpaid"
									}),
									e.adjusted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "info",
										children: "adjusted"
									}) : null
								]
							}, e.id)), row.entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-muted",
								children: "No punches this week."
							}) : null]
						})
					]
				}, row.employee.id);
			}), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No technicians on the roster."
			}) }) : null]
		})]
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-elevated px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] uppercase tracking-wide text-subtle",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono text-sm tabular",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] text-subtle",
				children: hint
			})
		]
	});
}
//#endregion
export { TimecardsPage as component };
