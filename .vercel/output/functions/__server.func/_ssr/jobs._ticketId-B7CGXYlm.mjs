import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { _ as formatHours, h as formatClock, v as formatMoney } from "./session.server-DT32kkW4.mjs";
import { t as Card } from "./card-L2k1Mubk.mjs";
import { t as ExceptionTone } from "./status-CJXHZwrD.mjs";
import { i as getJob } from "./api-D-PkeQOG.mjs";
import { n as Route$1 } from "./router-tqzv1bGm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/jobs._ticketId-B7CGXYlm.js
var import_jsx_runtime = require_jsx_runtime();
function JobDetail() {
	const { ticketId } = Route$1.useParams();
	const q = useQuery({
		queryKey: ["job", ticketId],
		queryFn: () => getJob({ data: ticketId })
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-80 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { ticket, entries, parts, exceptions, profile } = q.data;
	const tz = profile.settings.timezone;
	const billed = entries.filter((e) => e.kind === "work").reduce((s, e) => s + (e.clockOut ? e.billableMinutes : (Date.now() - new Date(e.clockIn).getTime()) / 6e4), 0) / 60;
	const delta = billed - ticket.expectedHours;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/app/jobs",
				className: "text-sm text-muted hover:text-fg",
				children: "← Jobs"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "font-mono text-primary",
					children: ["#", ticket.ticketNumber]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-semibold tracking-tight",
					children: ticket.customerName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						ticket.addressLine,
						", ",
						ticket.city,
						", ",
						ticket.state,
						" ",
						ticket.zip
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-wide text-subtle",
							children: "Expected"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-mono text-xl tabular",
							children: [formatHours(ticket.expectedHours), "h"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted",
							children: ticket.codes.map((c) => `${c.code} ${c.hoursExpected}`).join(" + ")
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-wide text-subtle",
							children: "Actual billable"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-mono text-xl tabular",
							children: [formatHours(billed), "h"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted",
							children: delta > .1 ? "Under-coded vs time" : delta < -.1 ? "Codes exceed time" : "Within tolerance"
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-wide text-subtle",
							children: "Invoice"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-xl tabular",
							children: formatMoney(ticket.invoiceAmount)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted",
							children: ticket.invoiceNumber ?? "Not imported"
						})
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-sm font-semibold",
				children: "Time on this ticket"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2 text-sm",
				children: [entries.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "capitalize text-muted",
						children: e.kind
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono tabular",
						children: [
							formatClock(e.clockIn, tz),
							" – ",
							e.clockOut ? formatClock(e.clockOut, tz) : "open"
						]
					})]
				}, e.id)), entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-muted",
					children: "No punches yet."
				}) : null]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-sm font-semibold",
				children: "Parts"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2 text-sm",
				children: [parts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						p.manufacturer,
						" ",
						p.part_number,
						" · ",
						p.description
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono",
						children: [
							"×",
							p.quantity,
							" ",
							formatMoney(p.unit_price)
						]
					})]
				}, p.id)), parts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-muted",
					children: "No parts posted."
				}) : null]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-sm font-semibold",
				children: "Exceptions"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2",
				children: [exceptions.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-start gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExceptionTone, { kind: x.kind }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: x.message
					})]
				}, x.id)), exceptions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-sm text-muted",
					children: "None."
				}) : null]
			})] })
		]
	});
}
//#endregion
export { JobDetail as component };
