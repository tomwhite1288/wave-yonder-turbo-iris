import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { t as Card } from "./card-BAydSPMQ.mjs";
import { r as signIn, t as authClient } from "./client-B40BzJxt.mjs";
import { t as Button } from "./button-C29DqKPd.mjs";
import { t as Input } from "./input-CtgSStje.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as GROK_PROVIDERS } from "./server-lXD2ZdYx.mjs";
import { _ as HardHat, d as Radio, s as ShieldCheck } from "../_libs/lucide-react.mjs";
import { r as Route$19 } from "./router-BVfsnTiD.mjs";
import { r as getAdminLoginMeta, t as claimAdministrator } from "./api-admin-DypS8IQV.mjs";
import { a as useCurrentUserState, n as SignedIn, r as SignedOut } from "./gates-B_IGPI9u.mjs";
import { r as stashAdminCode, t as clearAdminCode } from "./admin-login-DELCrQro.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-Cumzei0c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminCodeFields({ code, onChange, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block space-y-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-xs font-medium uppercase tracking-wide text-subtle",
				children: "Administrator access code"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				type: "password",
				autoComplete: "off",
				placeholder: "Company admin code",
				value: code,
				onChange: (e) => onChange(e.target.value),
				required: true,
				minLength: 6
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					"Factory code until you change it in Settings:",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-fg",
						children: hint
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Use the code set in Settings → Administrator access."
			})
		]
	});
}
function useAdminLoginMeta() {
	return useQuery({
		queryKey: ["admin-login-meta"],
		queryFn: () => getAdminLoginMeta(),
		staleTime: 3e4
	});
}
function UnlockAdminForm({ onUnlocked }) {
	const qc = useQueryClient();
	const meta = useAdminLoginMeta();
	const [code, setCode] = (0, import_react.useState)("");
	const mut = useMutation({
		mutationFn: (value) => claimAdministrator({ data: { code: value } }),
		onSuccess: (res) => {
			clearAdminCode();
			toast.success(res.alreadyAdmin ? "Administrator already unlocked" : "Administrator access granted");
			qc.invalidateQueries({ queryKey: ["profile"] });
			qc.invalidateQueries({ queryKey: ["settings"] });
			onUnlocked?.();
		},
		onError: (e) => toast.error(e.message)
	});
	function onSubmit(e) {
		e.preventDefault();
		mut.mutate(code);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "space-y-3",
		onSubmit,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminCodeFields, {
			code,
			onChange: setCode,
			hint: meta.data?.defaultCode ?? null
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "submit",
			className: "w-full",
			disabled: mut.isPending || code.trim().length < 6,
			children: mut.isPending ? "Checking…" : "Unlock administrator"
		})]
	});
}
function GateChoice({ title, body, icon, onClick, primary }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: primary ? "flex w-full items-start gap-3 rounded-xl bg-primary px-4 py-4 text-left text-primary-fg transition-opacity hover:opacity-90" : "flex w-full items-start gap-3 rounded-xl bg-elevated px-4 py-4 text-left text-fg shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 grid size-10 place-items-center rounded-lg bg-bg/15",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `mt-0.5 block text-sm ${primary ? "text-primary-fg/80" : "text-muted"}`,
			children: body
		})] })]
	});
}
function AdminMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-5" });
}
function Login() {
	const search = Route$19.useSearch();
	const { user, isPending } = useCurrentUserState();
	const [gate, setGate] = (0, import_react.useState)(search.mode === "admin" ? "admin" : "pick");
	const [mode, setMode] = (0, import_react.useState)("in");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [adminCode, setAdminCode] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const meta = useAdminLoginMeta();
	async function onEmail(e) {
		e.preventDefault();
		setError(null);
		if (gate === "admin") {
			if (adminCode.trim().length < 6) {
				setError("Enter the administrator access code first");
				return;
			}
			stashAdminCode(adminCode);
		} else clearAdminCode();
		setBusy(true);
		try {
			if (mode === "up") {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name || email.split("@")[0] || "Field user",
					callbackURL: gate === "admin" ? "/app?admin=1" : "/app"
				});
				if (err) throw new Error(err.message);
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password,
					callbackURL: gate === "admin" ? "/app?admin=1" : "/app"
				});
				if (err) throw new Error(err.message);
			}
			window.location.href = gate === "admin" ? "/app?admin=1" : "/app";
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign-in failed");
		} finally {
			setBusy(false);
		}
	}
	function startProvider(providerId) {
		if (gate === "admin") {
			if (adminCode.trim().length < 6) {
				setError("Enter the administrator access code first");
				return;
			}
			stashAdminCode(adminCode);
		} else clearAdminCode();
		signIn(providerId, { callbackURL: gate === "admin" ? "/app?admin=1" : "/app" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md stagger-in",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-11 place-items-center rounded-lg bg-surface text-primary shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xl font-semibold tracking-tight",
						children: "Field Ledger"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm text-muted",
						children: "Maichle's Edge companion"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "rounded-2xl p-5",
					children: gate === "pick" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg font-semibold",
							children: "Who is signing in?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Administrators unlock the board, payroll, and settings. Field team clocks in against assigned tickets."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GateChoice, {
								primary: true,
								title: "Administrator",
								body: "Office, payroll, code book, and company controls",
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminMark, {}),
								onClick: () => setGate("admin")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GateChoice, {
								title: "Field team",
								body: "Technicians and managers — Google, X, or work email",
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardHat, { className: "size-5" }),
								onClick: () => {
									clearAdminCode();
									setGate("field");
								}
							})]
						})
					] }) : gate === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium uppercase tracking-wide",
								children: "Administrator"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 text-lg font-semibold",
							children: "Company admin sign-in"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Enter the access code, then sign in with Google, X, or email. That account becomes an administrator — even if it was created as a technician."
						}),
						isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-5 h-24 animate-pulse rounded-lg bg-elevated" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mb-3 text-sm text-muted",
								children: [
									"Signed in as ",
									user?.primaryEmail || user?.displayName || "this account",
									". Unlock admin on this login."
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnlockAdminForm, { onUnlocked: () => {
								window.location.href = "/app";
							} })]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminCodeFields, {
									code: adminCode,
									onChange: (v) => {
										setAdminCode(v);
										setError(null);
									},
									hint: meta.data?.defaultCode ?? null
								}),
								GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "secondary",
									className: "w-full",
									disabled: adminCode.trim().length < 6,
									onClick: () => startProvider(p.providerId),
									children: ["Continue with ", p.label]
								}, p.providerId)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 py-1 text-[11px] uppercase tracking-wide text-subtle",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
										"or email",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									className: "space-y-3",
									onSubmit: onEmail,
									children: [
										mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Full name",
											value: name,
											onChange: (e) => setName(e.target.value),
											autoComplete: "name"
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "email",
											placeholder: "Work email",
											value: email,
											onChange: (e) => setEmail(e.target.value),
											autoComplete: "email",
											required: true
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "password",
											placeholder: "Password",
											value: password,
											onChange: (e) => setPassword(e.target.value),
											autoComplete: mode === "up" ? "new-password" : "current-password",
											required: true,
											minLength: 8
										}),
										error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-danger",
											children: error
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											className: "w-full",
											disabled: busy,
											children: busy ? "Working…" : mode === "up" ? "Create admin account" : "Sign in as administrator"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "w-full text-center text-sm text-muted hover:text-fg",
									onClick: () => setMode(mode === "up" ? "in" : "up"),
									children: mode === "up" ? "Already have an account? Sign in" : "Need an account? Create one"
								})
							]
						}) })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-4 text-sm text-muted hover:text-fg",
							onClick: () => setGate("pick"),
							children: "Back to sign-in choices"
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg font-semibold",
							children: "Field team sign-in"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Roster emails match existing employees. Everyone else is created as a technician."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 space-y-3",
							children: [
								GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "secondary",
									className: "w-full",
									onClick: () => startProvider(p.providerId),
									children: ["Continue with ", p.label]
								}, p.providerId)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 py-1 text-[11px] uppercase tracking-wide text-subtle",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
										"or email",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									className: "space-y-3",
									onSubmit: onEmail,
									children: [
										mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Full name",
											value: name,
											onChange: (e) => setName(e.target.value),
											autoComplete: "name"
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "email",
											placeholder: "Work email",
											value: email,
											onChange: (e) => setEmail(e.target.value),
											autoComplete: "email",
											required: true
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "password",
											placeholder: "Password",
											value: password,
											onChange: (e) => setPassword(e.target.value),
											autoComplete: mode === "up" ? "new-password" : "current-password",
											required: true,
											minLength: 8
										}),
										error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-danger",
											children: error
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											className: "w-full",
											disabled: busy,
											children: busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "w-full text-center text-sm text-muted hover:text-fg",
									onClick: () => setMode(mode === "up" ? "in" : "up"),
									children: mode === "up" ? "Already have an account? Sign in" : "Need an account? Create one"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-4 text-sm text-muted hover:text-fg",
							onClick: () => setGate("pick"),
							children: "Back to sign-in choices"
						})
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-center text-xs text-subtle",
					children: [
						"Independent of the primary ticket platform.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "text-muted underline-offset-4 hover:underline",
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
