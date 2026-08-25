import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { f as formatHours, p as formatMoney } from "./session.server-DEz6QvgN.mjs";
import { t as Card } from "./card-BAydSPMQ.mjs";
import { c as listCodes, p as upsertCode } from "./api-ops-BFJsObFf.mjs";
import { t as Button } from "./button-C29DqKPd.mjs";
import { t as Input } from "./input-CtgSStje.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/codes-DCCZuBwp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CodesPage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["codes"],
		queryFn: () => listCodes()
	});
	const [code, setCode] = (0, import_react.useState)("");
	const [hours, setHours] = (0, import_react.useState)("1");
	const [description, setDescription] = (0, import_react.useState)("");
	const mut = useMutation({
		mutationFn: upsertCode,
		onSuccess: () => {
			toast.success("Code saved");
			setCode("");
			setDescription("");
			qc.invalidateQueries({ queryKey: ["codes"] });
		},
		onError: (e) => toast.error(e.message)
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { items, profile } = q.data;
	const isAdmin = profile.employee.role === "admin";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Code book"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Expected hours per invoice code. Values are not hard-coded."
			})] }),
			isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "grid gap-2 sm:grid-cols-[1fr_1fr_80px_auto]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Code",
						value: code,
						onChange: (e) => setCode(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Description",
						value: description,
						onChange: (e) => setDescription(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Hours",
						value: hours,
						onChange: (e) => setHours(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => mut.mutate({ data: {
							code,
							description: description || code,
							category: "Labor",
							trade: "both",
							hours: Number(hours) || 1,
							laborValue: (Number(hours) || 1) * profile.settings.laborRate,
							active: true
						} }),
						children: "Add"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "min-w-[640px] w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-[11px] uppercase tracking-wide text-subtle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "border-b border-border",
							children: [
								"Code",
								"Description",
								"Trade",
								"Hours",
								"Labor"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: h
							}, h))
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: items.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/70 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono",
								children: c.code
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: c.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 capitalize text-muted",
								children: c.trade
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatHours(c.hours)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 font-mono tabular",
								children: formatMoney(c.laborValue)
							})
						]
					}, c.id)) })]
				})
			})
		]
	});
}
//#endregion
export { CodesPage as component };
