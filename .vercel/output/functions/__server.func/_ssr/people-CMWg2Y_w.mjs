import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { v as formatMoney } from "./session.server-DT32kkW4.mjs";
import { t as Button } from "./button-3OtcC0YW.mjs";
import { t as Badge } from "./badge-C3qa10Sn.mjs";
import { s as listPeople } from "./api-D-PkeQOG.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as setAccountStatus, s as setEmployeeRole } from "./api-admin-CpHWMZW0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/people-CMWg2Y_w.js
var import_jsx_runtime = require_jsx_runtime();
function PeoplePage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["people"],
		queryFn: () => listPeople()
	});
	const statusMut = useMutation({
		mutationFn: setAccountStatus,
		onSuccess: () => {
			toast.success("Account updated");
			qc.invalidateQueries({ queryKey: ["people"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const roleMut = useMutation({
		mutationFn: setEmployeeRole,
		onSuccess: () => {
			toast.success("Role updated");
			qc.invalidateQueries({ queryKey: ["people"] });
			qc.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (e) => toast.error(e.message)
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { people, profile } = q.data;
	const isAdmin = profile.employee.role === "admin";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: "People"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Approve new logins, set roles, and keep wage history by effective date."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 md:grid-cols-2",
			children: people.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium",
							children: p.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted",
							children: [
								p.employeeNumber,
								" · ",
								p.email
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: p.role === "admin" ? "info" : p.role === "manager" ? "warn" : "ok",
							children: p.role
						})]
					}),
					p.accountStatus !== "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-warn",
						children: p.accountStatus === "pending" ? "Waiting for administrator approval" : "Disabled"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs uppercase tracking-wide text-subtle",
								children: "Department"
							}), p.department] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs uppercase tracking-wide text-subtle",
								children: "Wage"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono",
								children: [formatMoney(p.hourlyWage), "/hr"]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs uppercase tracking-wide text-subtle",
								children: "Vehicle"
							}), p.vehicle ?? "—"] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs uppercase tracking-wide text-subtle",
								children: "Linked login"
							}), p.userId ? "Yes" : "Pending"] })
						]
					}),
					isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [p.accountStatus === "pending" || p.accountStatus === "disabled" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							onClick: () => statusMut.mutate({ data: {
								employeeId: p.id,
								status: "active"
							} }),
							children: "Approve"
						}), p.accountStatus === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "danger",
							onClick: () => statusMut.mutate({ data: {
								employeeId: p.id,
								status: "disabled"
							} }),
							children: "Deny"
						}) : null]
					}) : p.role !== "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						className: "mt-3",
						onClick: () => statusMut.mutate({ data: {
							employeeId: p.id,
							status: "disabled"
						} }),
						children: "Disable sign-in"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 block text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
							children: "Role"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg",
							value: p.role,
							disabled: roleMut.isPending,
							onChange: (e) => roleMut.mutate({ data: {
								employeeId: p.id,
								role: e.target.value
							} }),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "admin",
									children: "Administrator"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "manager",
									children: "Manager"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "technician",
									children: "Technician"
								})
							]
						})]
					})] }) : null
				]
			}, p.id))
		})]
	});
}
//#endregion
export { PeoplePage as component };
