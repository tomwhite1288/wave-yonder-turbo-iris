import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { g as formatDuration, h as formatClock } from "./session.server-DT32kkW4.mjs";
import { p as minutesBetween } from "./queries.server-C0KNibQt.mjs";
import { t as Button } from "./button-3OtcC0YW.mjs";
import { t as Badge } from "./badge-C3qa10Sn.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { d as listTimecards, t as approveTimecard } from "./api-ops-Bo8xhUq6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/timecards-BLLz9vx_.js
var import_jsx_runtime = require_jsx_runtime();
function TimecardsPage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["timecards"],
		queryFn: () => listTimecards()
	});
	const approve = useMutation({
		mutationFn: approveTimecard,
		onSuccess: () => {
			toast.success("Timecard approved");
			qc.invalidateQueries({ queryKey: ["timecards"] });
		}
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { entries, cards, people, profile, from, to } = q.data;
	const tz = profile.settings.timezone;
	const canApprove = profile.employee.role !== "technician";
	const byEmp = people.filter((p) => p.role === "technician" || entries.some((e) => e.employeeId === p.id)).map((p) => ({
		person: p,
		entries: entries.filter((e) => e.employeeId === p.id),
		card: cards.find((c) => c.employee_id === p.id)
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: "Timecards"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted",
			children: [
				"Week of ",
				from,
				" – ",
				to,
				". Originals are preserved when hours are edited."
			]
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-4",
			children: byEmp.map(({ person, entries: mine, card }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-medium",
						children: person.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted",
						children: person.employeeNumber
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: card?.status === "approved" ? "ok" : "warn",
							children: card?.status ?? "open"
						}), canApprove ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => approve.mutate({ data: {
								employeeId: person.id,
								workDate: from,
								note: "Approved from Field Ledger"
							} }),
							children: "Approve week"
						}) : null]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-1 text-sm",
					children: [mine.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "capitalize text-muted",
								children: e.kind
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
							e.adjusted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "info",
								children: "adjusted"
							}) : null
						]
					}, e.id)), mine.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-muted",
						children: "No punches this week."
					}) : null]
				})]
			}, person.id))
		})]
	});
}
//#endregion
export { TimecardsPage as component };
