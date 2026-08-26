import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { D as ArrowRight, T as BookOpen, d as Radio, g as MapPinned, n as Wallet, o as Timer, s as ShieldCheck } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BMX0SNlA.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-dvh bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mx-auto flex max-w-5xl items-center justify-between px-5 py-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-9 place-items-center rounded-md bg-surface text-primary shadow-[var(--shadow-border)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm font-semibold",
					children: "Field Ledger"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[11px] text-muted",
					children: "Maichle's Edge"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				size: "sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/login",
					children: ["Sign in ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto max-w-5xl px-5 pb-16 pt-8 stagger-in",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.18em] text-primary",
					children: "Companion intelligence layer"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl",
					children: "Dispatch, payroll, and job-site truth — beside the service platform, not instead of it."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-2xl text-base text-muted",
					children: "Field Ledger is the Maichle's Edge companion for the office desk and the truck. Tickets still key off Ticket Number. This system runs the dispatch board, GPS attendance, invoice vs plumbing vs HVAC codes, and payroll."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-wrap gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/Maichles-Code-Book.html",
							children: ["Phone code book ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: "Field Ledger sign-in"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-2xl text-sm text-muted",
					children: "The truck copy is one HTML file on this site. Open it on the phone and add it to the home screen — or save that single file. Do not add a zip, a Python server, or extra CSS; iPhone and Android will not host a folder of scripts."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
					children: [
						{
							icon: MapPinned,
							title: "GPS attendance",
							body: "On site, approaching, working, left site — evidence, never silent payroll edits."
						},
						{
							icon: Timer,
							title: "Timekeeping engine",
							body: "Clock-in, billable vs non-billable, travel, admin, and immutable originals."
						},
						{
							icon: BookOpen,
							title: "Code validation",
							body: "A+C+B hours vs actual field time, with configurable ±15 minute tolerance."
						},
						{
							icon: Wallet,
							title: "Payroll estimates",
							body: "Historical wage rates, overtime, contribution after labor — not a paycheck processor."
						},
						{
							icon: ShieldCheck,
							title: "Exceptions & audit",
							body: "Under-billed, over-billed, left site, missing codes. Every edit keeps the original."
						},
						{
							icon: Radio,
							title: "Dispatch board",
							body: "Shift / day / week timeline, drag-assign work orders, live GPS map. Companion desk — not a clone of invoicing."
						}
					].map((item) => {
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5 text-primary" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 text-sm font-semibold",
									children: item.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: item.body
								})
							]
						}, item.title);
					})
				})
			]
		})]
	});
}
//#endregion
export { Home as component };
