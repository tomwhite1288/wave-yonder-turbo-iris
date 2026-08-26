import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { H as roughGrossProfit, S as formatClock, T as formatMoney, a as KIND_LABEL, k as hoursFromEntries, w as formatHours } from "./session.server-BThkfVCN.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Input } from "./input-Cwgm8t2d.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Spinner } from "./spinner-Bz_S9RQQ.mjs";
import { t as Badge } from "./badge-BgqgnlCo.mjs";
import { t as ExceptionTone } from "./status-CK2L7Kdp.mjs";
import { r as getJob } from "./api-CRRtNY9Y.mjs";
import { i as setTicketJobKind } from "./api-dispatch-DPRVE5QJ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as listCodes } from "./api-ops-DOOYjFmA.mjs";
import { n as attachTicketCode, t as addJobReceipt } from "./api-account-C7rcPmzy.mjs";
import { n as Route$1 } from "./router-CeFaQ0d1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/jobs._ticketId-2_ODoV9-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function JobDetail() {
	const { ticketId } = Route$1.useParams();
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["job", ticketId],
		queryFn: () => getJob({ data: ticketId })
	});
	const codesQ = useQuery({
		queryKey: ["codes"],
		queryFn: () => listCodes()
	});
	const [code, setCode] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [vendor, setVendor] = (0, import_react.useState)("");
	const attach = useMutation({
		mutationFn: attachTicketCode,
		onSuccess: () => {
			toast.success("Code attached");
			setCode("");
			qc.invalidateQueries({ queryKey: ["job", ticketId] });
		},
		onError: (e) => toast.error(e.message)
	});
	const receipt = useMutation({
		mutationFn: addJobReceipt,
		onSuccess: () => {
			toast.success("Receipt saved");
			setAmount("");
			setVendor("");
			qc.invalidateQueries({ queryKey: ["job", ticketId] });
			qc.invalidateQueries({ queryKey: ["exceptions"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const kindMut = useMutation({
		mutationFn: setTicketJobKind,
		onSuccess: () => {
			toast.success("Ticket type saved");
			qc.invalidateQueries({ queryKey: ["job", ticketId] });
			qc.invalidateQueries({ queryKey: ["jobs"] });
			qc.invalidateQueries({ queryKey: ["dispatch"] });
		}
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { label: "Opening job…" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { ticket, entries, parts, exceptions, receipts, profile } = q.data;
	const tz = profile.settings.timezone;
	const hours = hoursFromEntries(entries);
	const onSite = (hours.billable + hours.show) / 60;
	const paid = hours.paid / 60;
	const delta = onSite - ticket.expectedHours;
	const receiptCost = receipts.reduce((s, r) => s + r.amount, 0);
	const laborValue = ticket.laborAmount || ticket.codes.reduce((s, c) => s + c.laborValue, 0) || ticket.expectedHours * profile.settings.laborRate;
	const gp = roughGrossProfit({
		laborValue,
		receiptCost,
		partsMarkup: profile.settings.partsMarkup,
		paidHours: paid,
		wage: profile.employee.hourlyWage
	});
	const canManage = profile.employee.role !== "technician";
	const book = codesQ.data?.items ?? [];
	const allowance = ticket.codes.reduce((s, c) => {
		return s + (book.find((b) => b.code === c.code)?.partsAllowance ?? 0);
	}, 0);
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
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: [ticket.jobKind === "callback" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "warn",
						children: "Callback"
					}) : null, ticket.jobKind === "warranty" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "info",
						children: "Warranty"
					}) : null]
				}),
				canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-3 gap-2",
					children: [
						"service",
						"callback",
						"warranty"
					].map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `h-11 rounded-md text-sm capitalize ${ticket.jobKind === k ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`,
						onClick: () => kindMut.mutate({ data: {
							ticketId: ticket.id,
							jobKind: k
						} }),
						children: k
					}, k))
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-wide text-subtle",
							children: "Sold / codes"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-mono text-xl tabular",
							children: [formatHours(ticket.expectedHours), "h"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted",
							children: ticket.codes.map((c) => `${c.code} ${c.hoursExpected}`).join(" + ") || "No code"
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-wide text-subtle",
							children: "GPS on site"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-mono text-xl tabular",
							children: [formatHours(onSite), "h"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted",
							children: delta > .1 ? "Time exceeds codes" : delta < -.1 ? "Codes exceed time" : "Within tolerance"
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-wide text-subtle",
							children: "Paid on this job"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-mono text-xl tabular",
							children: [formatHours(paid), "h"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted",
							children: [
								"Unpaid ",
								formatHours(hours.unpaid / 60),
								"h"
							]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] uppercase tracking-wide text-subtle",
							children: "Rough GP"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-xl tabular",
							children: formatMoney(gp.gp)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted",
							children: [
								"Labor ",
								formatMoney(laborValue),
								" · parts sell ",
								formatMoney(gp.partsSell)
							]
						})
					] })
				]
			}),
			canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-2 text-sm font-semibold",
				children: "Attach invoice / job code"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					if (!code.trim()) return;
					attach.mutate({ data: {
						ticketId: ticket.id,
						code
					} });
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: code,
						onChange: (e) => setCode(e.target.value),
						list: "job-codes",
						placeholder: "Code",
						className: "max-w-40"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
						id: "job-codes",
						children: book.filter((c) => c.active).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: c.code,
							children: [
								c.description,
								" · ",
								c.hours,
								"h"
							]
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "sm",
						variant: "secondary",
						disabled: attach.isPending,
						children: "Attach"
					})
				]
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-sm font-semibold",
				children: "Time on this ticket"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2 text-sm",
				children: [entries.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: KIND_LABEL[e.kind] ?? e.kind
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono tabular",
							children: [
								formatClock(e.clockIn, tz),
								" – ",
								e.clockOut ? formatClock(e.clockOut, tz) : "open"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: e.gpsBacked && e.paidMinutes > 0 ? "ok" : "warn",
							children: e.paidMinutes > 0 ? "paid" : "unpaid"
						})
					]
				}, e.id)), entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-muted",
					children: "No punches yet — this is a missing-time flag until they clock."
				}) : null]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-3 flex flex-wrap items-start justify-between gap-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Parts receipts vs code range"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							"Code parts allowance ",
							formatMoney(allowance),
							". Markup ",
							profile.settings.partsMarkup,
							"×. Receipt cost",
							" ",
							formatMoney(receiptCost),
							"."
						]
					})] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mb-3 grid grid-cols-[1fr_1fr_auto] gap-2",
					onSubmit: (e) => {
						e.preventDefault();
						const n = Number(amount);
						if (!(n > 0)) return;
						receipt.mutate({ data: {
							ticketId: ticket.id,
							amount: n,
							vendor,
							code: ticket.codes[0]?.code
						} });
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							inputMode: "decimal",
							value: amount,
							onChange: (e) => setAmount(e.target.value),
							placeholder: "Receipt $"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: vendor,
							onChange: (e) => setVendor(e.target.value),
							placeholder: "Vendor"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "sm",
							variant: "secondary",
							disabled: receipt.isPending,
							children: "Add receipt"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-sm",
					children: [
						receipts.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								r.vendor || "Receipt",
								" ",
								r.code ? `· ${r.code}` : ""
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono",
								children: formatMoney(r.amount)
							})]
						}, r.id)),
						parts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between gap-3 text-muted",
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
						}, p.id)),
						receipts.length === 0 && parts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-muted",
							children: "No receipts yet."
						}) : null
					]
				})
			] }),
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
