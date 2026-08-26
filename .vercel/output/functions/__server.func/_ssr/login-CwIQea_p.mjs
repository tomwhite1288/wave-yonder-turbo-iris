import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { t as Button } from "./button-DptnA-9j.mjs";
import { t as Input } from "./input-Cwgm8t2d.mjs";
import { t as Card } from "./card-CugKTQmh.mjs";
import { t as Spinner } from "./spinner-Bz_S9RQQ.mjs";
import { d as Radio } from "../_libs/lucide-react.mjs";
import { d as setupShopLogin, f as shopStatus, i as pinLogin } from "./api-admin-Cf7s1NH1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-CwIQea_p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const status = useQuery({
		queryKey: ["shop-status"],
		queryFn: () => shopStatus()
	});
	const needsSetup = status.isError || Boolean(status.data?.needsSetup);
	const [name, setName] = (0, import_react.useState)("");
	const [username, setUsername] = (0, import_react.useState)("");
	const [pin, setPin] = (0, import_react.useState)("");
	const [pin2, setPin2] = (0, import_react.useState)("");
	const [unlockCode, setUnlockCode] = (0, import_react.useState)("");
	const [techName, setTechName] = (0, import_react.useState)("");
	const [techUser, setTechUser] = (0, import_react.useState)("");
	const [techPin, setTechPin] = (0, import_react.useState)("");
	const [mgrName, setMgrName] = (0, import_react.useState)("");
	const [mgrUser, setMgrUser] = (0, import_react.useState)("");
	const [mgrPin, setMgrPin] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onSubmit(e) {
		e.preventDefault();
		setError(null);
		setBusy(true);
		try {
			if (needsSetup) {
				if (pin !== pin2) throw new Error("PINs do not match");
				const staff = [];
				if (mgrUser && mgrPin.length >= 4) staff.push({
					role: "manager",
					username: mgrUser,
					pin: mgrPin,
					name: mgrName || "Office Supervisor"
				});
				if (techUser && techPin.length >= 4) staff.push({
					role: "technician",
					username: techUser,
					pin: techPin,
					name: techName || "Field Technician"
				});
				await setupShopLogin({ data: {
					username,
					pin,
					name,
					unlockCode: unlockCode.trim() || void 0,
					staff
				} });
			} else await pinLogin({ data: {
				username,
				pin
			} });
			window.location.href = "/app";
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not sign in");
		} finally {
			setBusy(false);
		}
	}
	if (status.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spinner, { label: "Opening sign-in…" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-md bg-surface text-primary shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-base font-semibold tracking-tight",
						children: "Field Ledger"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted",
						children: "Maichle's Edge"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "rounded-xl p-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "space-y-4",
						onSubmit: (e) => void onSubmit(e),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-lg font-semibold",
								children: needsSetup ? "Activate this shop" : "Sign in"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: needsSetup ? "Save the administrator username and PIN on the server. Without an activation code this copy runs a 7-day demo. Add a supervisor and a field tech now, or later in People." : "Use the username and PIN the office assigned you."
							})] }),
							needsSetup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-muted",
									children: "Administrator name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: name,
									onChange: (e) => setName(e.target.value),
									autoComplete: "name",
									placeholder: "Pat Maichle"
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-muted",
									children: needsSetup ? "Admin username" : "Username"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: username,
									onChange: (e) => setUsername(e.target.value),
									autoComplete: "username",
									autoCapitalize: "none",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-muted",
									children: "PIN"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "password",
									inputMode: "numeric",
									autoComplete: needsSetup ? "new-password" : "current-password",
									value: pin,
									onChange: (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8)),
									required: true
								})]
							}),
							needsSetup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-medium text-muted",
										children: "Confirm PIN"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "password",
										inputMode: "numeric",
										value: pin2,
										onChange: (e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 8)),
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-medium text-muted",
										children: "Activation code (optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: unlockCode,
										onChange: (e) => setUnlockCode(e.target.value),
										autoComplete: "off",
										placeholder: "Leave blank for 7-day demo"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 rounded-lg bg-elevated p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-medium uppercase tracking-wide text-subtle",
											children: "Optional field tech"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Name",
											value: techName,
											onChange: (e) => setTechName(e.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "username",
											autoCapitalize: "none",
											value: techUser,
											onChange: (e) => setTechUser(e.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "PIN",
											type: "password",
											inputMode: "numeric",
											value: techPin,
											onChange: (e) => setTechPin(e.target.value.replace(/\D/g, "").slice(0, 8))
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 rounded-lg bg-elevated p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-medium uppercase tracking-wide text-subtle",
											children: "Optional supervisor / office"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Name",
											value: mgrName,
											onChange: (e) => setMgrName(e.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "username",
											autoCapitalize: "none",
											value: mgrUser,
											onChange: (e) => setMgrUser(e.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "PIN",
											type: "password",
											inputMode: "numeric",
											value: mgrPin,
											onChange: (e) => setMgrPin(e.target.value.replace(/\D/g, "").slice(0, 8))
										})
									]
								})
							] }) : null,
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-md bg-elevated px-3 py-2 text-sm text-danger",
								children: error
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "h-11 w-full",
								disabled: busy || status.isPending,
								type: "submit",
								children: busy ? "Working…" : needsSetup ? "Save office login" : "Continue"
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 text-center text-xs text-subtle",
					children: [
						needsSetup ? "Demo mode until activation. Extend or disable the trial in Settings." : "Assign logins in People.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "hover:text-muted",
							children: "Back"
						})
					]
				})
			]
		})
	});
}
//#endregion
export { Login as component };
