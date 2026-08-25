import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { t as Card } from "./card-BAydSPMQ.mjs";
import { f as saveSettings, o as getSettings } from "./api-ops-BFJsObFf.mjs";
import { t as Button } from "./button-C29DqKPd.mjs";
import { t as Input } from "./input-CtgSStje.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as setAdminAccessCode, i as saveAdminEmails, n as getAdminEmails } from "./api-admin-DypS8IQV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-KROR3Zwk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["settings"],
		queryFn: () => getSettings()
	});
	const emailsQ = useQuery({
		queryKey: ["admin-emails"],
		queryFn: () => getAdminEmails(),
		enabled: q.data?.profile.employee.role === "admin"
	});
	const mut = useMutation({
		mutationFn: saveSettings,
		onSuccess: () => {
			toast.success("Settings saved");
			qc.invalidateQueries({ queryKey: ["settings"] });
			qc.invalidateQueries({ queryKey: ["profile"] });
		}
	});
	const codeMut = useMutation({
		mutationFn: setAdminAccessCode,
		onSuccess: () => {
			toast.success("Administrator code updated");
			setCurrentCode("");
			setNextCode("");
			qc.invalidateQueries({ queryKey: ["admin-login-meta"] });
			qc.invalidateQueries({ queryKey: ["settings"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const emailMut = useMutation({
		mutationFn: saveAdminEmails,
		onSuccess: () => {
			toast.success("Admin emails saved");
			qc.invalidateQueries({ queryKey: ["admin-emails"] });
			qc.invalidateQueries({ queryKey: ["settings"] });
			qc.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const s = q.data?.profile.settings;
	const [radius, setRadius] = (0, import_react.useState)();
	const [tolerance, setTolerance] = (0, import_react.useState)();
	const [ot, setOt] = (0, import_react.useState)();
	const [labor, setLabor] = (0, import_react.useState)();
	const [currentCode, setCurrentCode] = (0, import_react.useState)("");
	const [nextCode, setNextCode] = (0, import_react.useState)("");
	const [emails, setEmails] = (0, import_react.useState)();
	if (q.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-surface" });
	if (q.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	});
	if (!s) return null;
	if (q.data?.profile.employee.role !== "admin") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Administrator access required."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "System configuration"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Change company rules here — not in source code."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-4 rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Administrator access"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "The Administrator button on sign-in requires this code. After a successful unlock, that Google or email login is promoted to admin. Bind your Gmail below so it stays admin on the next sign-in."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
								children: "Current code"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								autoComplete: "off",
								value: currentCode,
								onChange: (e) => setCurrentCode(e.target.value),
								placeholder: s.adminHintVisible ? "EDGE-ADMIN" : "Current code"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
								children: "New code"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								autoComplete: "off",
								value: nextCode,
								onChange: (e) => setNextCode(e.target.value),
								placeholder: "At least 6 characters"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						disabled: codeMut.isPending || currentCode.trim().length < 6 || nextCode.trim().length < 6,
						onClick: () => codeMut.mutate({ data: {
							currentCode,
							nextCode
						} }),
						children: codeMut.isPending ? "Saving…" : "Change admin code"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
								children: "Auto-admin emails"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "min-h-24 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
								value: emails ?? (emailsQ.data?.emails ?? s.adminEmails).join("\n"),
								onChange: (e) => setEmails(e.target.value),
								placeholder: "you@gmail.com"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-xs text-muted",
								children: "One email per line. Those logins become administrator automatically."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						disabled: emailMut.isPending,
						onClick: () => emailMut.mutate({ data: { emails: emails ?? (emailsQ.data?.emails ?? s.adminEmails).join("\n") } }),
						children: "Save admin emails"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Job-site GPS radius (ft)",
						value: radius ?? String(s.gpsRadiusFt),
						onChange: setRadius
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Exception tolerance (min)",
						value: tolerance ?? String(s.exceptionToleranceMin),
						onChange: setTolerance
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Daily overtime after (hours)",
						value: ot ?? String(s.overtimeDailyHours),
						onChange: setOt
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Default labor rate",
						value: labor ?? String(s.laborRate),
						onChange: setLabor
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sm:col-span-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => mut.mutate({ data: {
								gps_radius_ft: Number(radius ?? s.gpsRadiusFt),
								exception_tolerance_min: Number(tolerance ?? s.exceptionToleranceMin),
								overtime_daily_hours: Number(ot ?? s.overtimeDailyHours),
								labor_rate: Number(labor ?? s.laborRate)
							} }),
							children: "Save rules"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Integration API"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: ["Independent of the primary platform schema. Send tickets in; receive time, GPS status, exceptions, and validated hours. Header: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-fg",
							children: "X-Field-Key"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "overflow-x-auto rounded-lg bg-elevated p-3 font-mono text-xs text-muted",
						children: `POST /api/integration/tickets
X-Field-Key: fld_demo_maichles_edge_2026

{
  "ticketNumber": "123499",
  "customer": "Example",
  "address": "105 J and M Dr, New Castle, DE",
  "lat": 39.662, "lng": -75.566,
  "technicianEmail": "john.smith@maichlesedge.com",
  "scheduledStart": "2026-08-25T13:00:00-04:00",
  "codes": ["A","C"],
  "invoiceNumber": "INV-90001",
  "invoiceAmount": 370
}

GET /api/integration/tickets/123499`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "space-y-2 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold text-fg",
						children: "Architecture"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Primary platform → ticket/invoice/customer payload → integration API → Field Ledger engines (time, GPS, codes, payroll, efficiency) → admin board / technician mobile." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Auth: Better Auth (Google, X, email). Roles: admin, manager, technician. GPS is attendance evidence. Historical pay rates and original punches are never overwritten." })
				]
			})
		]
	});
}
function Field({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-xs uppercase tracking-wide text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value,
			onChange: (e) => onChange(e.target.value)
		})]
	});
}
//#endregion
export { SettingsPage as component };
