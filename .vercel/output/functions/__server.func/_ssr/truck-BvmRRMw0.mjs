import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { t as Badge } from "./badge-6Eox1gID.mjs";
import { t as Button } from "./button-C29DqKPd.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as useTruckPart, n as replenishTruck, t as getTruck } from "./api-parts-GjozJF9k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/truck-BvmRRMw0.js
var import_jsx_runtime = require_jsx_runtime();
function TruckPage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["truck"],
		queryFn: () => getTruck({ data: {} })
	});
	const usePart = useMutation({
		mutationFn: useTruckPart,
		onSuccess: () => {
			toast.success("Part deducted from truck");
			qc.invalidateQueries({ queryKey: ["truck"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const fill = useMutation({
		mutationFn: replenishTruck,
		onSuccess: () => {
			toast.success("Replenished");
			qc.invalidateQueries({ queryKey: ["truck"] });
		}
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { items, profile } = q.data;
	const canFill = profile.employee.role !== "technician";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: "Truck stock"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Using a part on a ticket reduces van quantity."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-2",
			children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex flex-wrap items-center gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-mono text-sm",
							children: item.part.partNumber
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "truncate text-sm text-muted",
							children: [
								item.part.manufacturer,
								" · ",
								item.part.description
							]
						})]
					}),
					item.needsReplenish ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "warn",
						children: "below min"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "ok",
						children: "stocked"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-mono tabular",
						children: [
							item.quantity,
							" / min ",
							item.minQuantity
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						onClick: () => usePart.mutate({ data: {
							inventoryId: item.id,
							qty: 1
						} }),
						children: "Use 1"
					}),
					canFill ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: () => fill.mutate({ data: {
							inventoryId: item.id,
							qty: 2
						} }),
						children: "+2"
					}) : null
				]
			}, item.id))
		})]
	});
}
//#endregion
export { TruckPage as component };
