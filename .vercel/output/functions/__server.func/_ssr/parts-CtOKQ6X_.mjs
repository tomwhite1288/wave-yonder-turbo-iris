import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { p as formatMoney } from "./session.server-DEz6QvgN.mjs";
import { t as Badge } from "./badge-6Eox1gID.mjs";
import { t as Button } from "./button-C29DqKPd.mjs";
import { t as Input } from "./input-CtgSStje.mjs";
import { r as searchParts } from "./api-parts-GjozJF9k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/parts-CtOKQ6X_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PartsPage() {
	const [q, setQ] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [search, setSearch] = (0, import_react.useState)({
		q: "",
		category: ""
	});
	const items = useQuery({
		queryKey: ["parts", search],
		queryFn: () => searchParts({ data: search })
	}).data?.items ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Parts intelligence"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Plumbing and HVAC catalog. Search number, manufacturer, alias, or category."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex flex-col gap-2 sm:flex-row",
				onSubmit: (e) => {
					e.preventDefault();
					setSearch({
						q,
						category
					});
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "1225, capacitor, flapper…"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: category === "" ? "default" : "secondary",
							onClick: () => setCategory(""),
							children: "All"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: category === "plumbing" ? "default" : "secondary",
							onClick: () => setCategory("plumbing"),
							children: "Plumbing"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: category === "hvac" ? "default" : "secondary",
							onClick: () => setCategory("hvac"),
							children: "HVAC"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							children: "Search"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "min-w-[720px] w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-b border-border",
							children: [
								"Part",
								"Description",
								"Category",
								"Cost",
								"Sell",
								"Truck / WH"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: h
							}, h))
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/70 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono",
									children: p.partNumber
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted",
									children: p.manufacturer
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: p.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "info",
									children: p.category
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted",
									children: p.subcategory
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(p.cost)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(p.sellPrice)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: [
									p.stockQty,
									" / ",
									p.warehouseQty
								]
							})
						]
					}, p.id)) })]
				})
			})
		]
	});
}
//#endregion
export { PartsPage as component };
