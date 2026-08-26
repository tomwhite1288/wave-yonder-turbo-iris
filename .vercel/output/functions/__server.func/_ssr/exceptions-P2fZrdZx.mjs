import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { S as formatClock } from "./session.server-BThkfVCN.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Badge } from "./badge-BgqgnlCo.mjs";
import { t as ExceptionTone } from "./status-CK2L7Kdp.mjs";
import { c as ShieldAlert } from "../_libs/lucide-react.mjs";
import { d as resolveException, u as listExceptions } from "./api-ops-DOOYjFmA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/exceptions-P2fZrdZx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FILTERS = [
	{
		id: "open",
		label: "Open"
	},
	{
		id: "all",
		label: "All"
	},
	{
		id: "missing_time",
		label: "No punches"
	},
	{
		id: "unpaid_claim",
		label: "Unpaid claim"
	},
	{
		id: "under_billed",
		label: "Under-coded"
	},
	{
		id: "over_billed",
		label: "Over-coded"
	},
	{
		id: "missing_code",
		label: "No code"
	},
	{
		id: "office_mismatch",
		label: "Office GPS"
	},
	{
		id: "travel_mismatch",
		label: "Travel GPS"
	},
	{
		id: "parts_over_allowance",
		label: "Parts"
	}
];
function ExceptionsPage() {
	const qc = useQueryClient();
	const [filter, setFilter] = (0, import_react.useState)("open");
	const q = useQuery({
		queryKey: ["exceptions"],
		queryFn: () => listExceptions(),
		refetchInterval: 3e4
	});
	const mut = useMutation({
		mutationFn: resolveException,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["exceptions"] })
	});
	const items = q.data?.items ?? [];
	const visible = (0, import_react.useMemo)(() => {
		if (filter === "all") return items;
		if (filter === "open") return items.filter((x) => x.status === "open");
		return items.filter((x) => x.kind === filter);
	}, [items, filter]);
	const openCount = items.filter((x) => x.status === "open").length;
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { profile, from, to } = q.data;
	const can = profile.employee.role !== "technician";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-semibold tracking-tight",
					children: "Hours billed to the office"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						"Week ",
						from,
						" – ",
						to,
						". Flags fire when GPS, punches, invoice codes, or parts receipts do not match payable time (in transit, show, working, office)."
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: openCount ? "warn" : "ok",
					children: [openCount, " open"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto pb-1",
				children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setFilter(f.id),
					className: `h-9 shrink-0 rounded-md px-3 text-xs font-medium ${filter === f.id ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
					children: f.label
				}, f.id))
			}),
			visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "flex items-start gap-3 rounded-2xl p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mt-0.5 size-5 text-ok" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "No mismatches in this view"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						"Assigned jobs with no GPS-backed punches, travel claimed at the shop, office time away from",
						" ",
						profile.settings.officeAddress,
						", codes that do not cover on-site hours, and receipt prices over the code parts range all land here automatically."
					]
				})] })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: visible.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
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
			})
		]
	});
}
//#endregion
export { ExceptionsPage as component };
