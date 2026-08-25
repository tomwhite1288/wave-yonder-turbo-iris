import { b as Navigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { d as formatDuration, f as formatHours, u as formatClock } from "./session.server-DEz6QvgN.mjs";
import { t as Card } from "./card-BAydSPMQ.mjs";
import { n as GpsBadge } from "./status-ygevFQgK.mjs";
import { a as getLiveBoard, o as getSessionProfile } from "./api-DhC6-ygR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-BFD81puF.js
var import_jsx_runtime = require_jsx_runtime();
function BoardPage() {
	const profile = useQuery({
		queryKey: ["profile"],
		queryFn: () => getSessionProfile()
	});
	const board = useQuery({
		queryKey: ["board"],
		queryFn: () => getLiveBoard(),
		refetchInterval: 15e3,
		enabled: profile.data?.employee.role !== "technician"
	});
	if (profile.data?.employee.role === "technician") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/app/field" });
	if (board.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardSkeleton, {});
	if (board.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: board.error.message
	});
	const data = board.data;
	const tz = data.profile.settings.timezone;
	const working = data.rows.filter((r) => r.gpsStatus === "WORKING" || r.clockedIn).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-semibold tracking-tight",
					children: "Live board"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						working,
						" working · ",
						data.openExceptions,
						" open exceptions · ",
						data.profile.settings.companyName
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs text-subtle tabular",
					children: [
						"GPS radius ",
						data.profile.settings.gpsRadiusFt,
						" ft"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Technicians",
						value: String(data.rows.length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "On a ticket",
						value: String(data.rows.filter((r) => r.ticket).length)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Open exceptions",
						value: String(data.openExceptions)
					})
				]
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
								"Status",
								"Ticket",
								"On site",
								"Billable",
								"Expected",
								"Exception",
								"Duration"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: h
							}, h))
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/70 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-medium",
									children: row.employee.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted",
									children: [
										row.employee.department,
										" · ",
										row.employee.vehicle
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GpsBadge, { status: row.gpsStatus })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [row.ticket ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/app/jobs/$ticketId",
									params: { ticketId: row.ticket.id },
									className: "font-mono text-primary hover:underline",
									children: ["#", row.ticket.ticketNumber]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-subtle",
									children: "—"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "max-w-[220px] truncate text-xs text-muted",
									children: row.ticket ? `${row.ticket.customerName} · ${row.ticket.addressLine}` : "No active job"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 tabular",
								children: [row.distanceFt != null ? `${Math.round(row.distanceFt)} ft` : "—", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted",
									children: row.arrival ? formatClock(row.arrival, tz) : "—"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(row.billableHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(row.expectedHours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: row.openExceptions ? `${row.openExceptions} open` : "None"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatDuration(row.durationMin)
							})
						]
					}, row.employee.id)) })]
				})
			})
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-[11px] uppercase tracking-wide text-subtle",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 font-mono text-2xl tabular",
		children: value
	})] });
}
function BoardSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-72 animate-pulse rounded-xl bg-surface" });
}
//#endregion
export { BoardPage as component };
