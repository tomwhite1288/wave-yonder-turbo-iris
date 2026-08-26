import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Input } from "./input-Cwgm8t2d.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Spinner } from "./spinner-Bz_S9RQQ.mjs";
import { t as Badge } from "./badge-BgqgnlCo.mjs";
import { o as listPeople } from "./api-CRRtNY9Y.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as setAccountStatus, n as createShopUser, t as assignShopPin, u as setEmployeeRole } from "./api-admin-Cf7s1NH1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/people-kyB_LrAD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
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
	const pinMut = useMutation({
		mutationFn: assignShopPin,
		onSuccess: () => {
			toast.success("PIN saved");
			qc.invalidateQueries({ queryKey: ["people"] });
		},
		onError: (e) => toast.error(e.message)
	});
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { label: "Loading people…" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	const { people, profile } = q.data;
	const isAdmin = profile.employee.role === "admin";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "People"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Create live logins, set roles, and assign each person a username and PIN. Demo roster rows can stay disabled."
			})] }),
			isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateUserForm, {}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 md:grid-cols-2",
				children: people.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-medium",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted",
									children: [
										p.employeeNumber,
										" · ",
										p.email
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-subtle",
									children: ["Login: ", p.username || "none yet"]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
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
									children: "Classification"
								}), p.laborClassification] }),
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
						isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							p.accountStatus === "pending" || p.accountStatus === "disabled" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
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
											children: "Supervisor"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "technician",
											children: "Field technician"
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinForm, {
								employeeId: p.id,
								currentUsername: p.username ?? "",
								busy: pinMut.isPending,
								onSave: (username, pin) => pinMut.mutate({ data: {
									employeeId: p.id,
									username,
									pin
								} })
							})
						] }) : null
					]
				}, p.id))
			})
		]
	});
}
function CreateUserForm() {
	const qc = useQueryClient();
	const [firstName, setFirstName] = (0, import_react.useState)("");
	const [lastName, setLastName] = (0, import_react.useState)("");
	const [role, setRole] = (0, import_react.useState)("technician");
	const [username, setUsername] = (0, import_react.useState)("");
	const [pin, setPin] = (0, import_react.useState)("");
	const mut = useMutation({
		mutationFn: createShopUser,
		onSuccess: (res) => {
			toast.success(`Created ${res.employeeNumber}`);
			setFirstName("");
			setLastName("");
			setUsername("");
			setPin("");
			qc.invalidateQueries({ queryKey: ["people"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "space-y-3 rounded-2xl p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-semibold",
				children: "Create user"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Live login for admin, supervisor, office, or field tech. Saved on the server."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "First name",
						value: firstName,
						onChange: (e) => setFirstName(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Last name",
						value: lastName,
						onChange: (e) => setLastName(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "username",
						autoCapitalize: "none",
						value: username,
						onChange: (e) => setUsername(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "PIN (4–8 digits)",
						type: "password",
						inputMode: "numeric",
						value: pin,
						onChange: (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "h-11 rounded-md border border-border bg-elevated px-3 text-sm",
						value: role,
						onChange: (e) => setRole(e.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "technician",
								children: "Field technician"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "manager",
								children: "Supervisor / office"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "admin",
								children: "Administrator"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: mut.isPending || !firstName.trim() || !lastName.trim() || !username.trim() || pin.length < 4,
						onClick: () => mut.mutate({ data: {
							firstName,
							lastName,
							role,
							username,
							pin
						} }),
						children: mut.isPending ? "Saving…" : "Add user"
					})
				]
			})
		]
	});
}
function PinForm({ currentUsername, busy, onSave }) {
	const [username, setUsername] = (0, import_react.useState)(currentUsername);
	const [pin, setPin] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-3 grid grid-cols-2 gap-2",
		onSubmit: (e) => {
			e.preventDefault();
			onSave(username, pin);
			setPin("");
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				placeholder: "username",
				autoCapitalize: "none",
				value: username,
				onChange: (e) => setUsername(e.target.value),
				required: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				placeholder: "PIN",
				type: "password",
				inputMode: "numeric",
				value: pin,
				onChange: (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8)),
				required: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				size: "sm",
				className: "col-span-2",
				disabled: busy || !username || pin.length < 4,
				children: "Save username + PIN"
			})
		]
	});
}
//#endregion
export { PeoplePage as component };
