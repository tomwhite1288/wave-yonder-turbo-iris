import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { f as useRouterState, h as Outlet, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { c as cn } from "./session.server-DEz6QvgN.mjs";
import { o as getSessionProfile } from "./api-DhC6-ygR.mjs";
import { t as Button } from "./button-C29DqKPd.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as Activity, b as CalendarDays, c as ShieldAlert, d as Radio, f as Package, g as LayoutGrid, h as MapPin, i as Truck, l as Settings, n as Wallet, p as Menu, r as Users, s as ShieldCheck, t as X, u as ScrollText, v as Gauge, x as BookOpen, y as ClipboardList } from "../_libs/lucide-react.mjs";
import { t as claimAdministrator } from "./api-admin-DypS8IQV.mjs";
import { a as useCurrentUserState, i as UserButton, t as RedirectToSignIn } from "./gates-B_IGPI9u.mjs";
import { n as peekAdminCode, t as clearAdminCode } from "./admin-login-DELCrQro.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-Boce1WW9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NAV = [
	{
		to: "/app",
		label: "Board",
		icon: Radio,
		roles: ["admin", "manager"]
	},
	{
		to: "/app/field",
		label: "Today",
		icon: MapPin,
		roles: [
			"admin",
			"manager",
			"technician"
		]
	},
	{
		to: "/app/jobs",
		label: "Jobs",
		icon: ClipboardList,
		roles: [
			"admin",
			"manager",
			"technician"
		]
	},
	{
		to: "/app/timecards",
		label: "Timecards",
		icon: LayoutGrid,
		roles: [
			"admin",
			"manager",
			"technician"
		]
	},
	{
		to: "/app/exceptions",
		label: "Exceptions",
		icon: ShieldAlert,
		roles: [
			"admin",
			"manager",
			"technician"
		]
	},
	{
		to: "/app/payroll",
		label: "Payroll",
		icon: Wallet,
		roles: ["admin", "manager"]
	},
	{
		to: "/app/efficiency",
		label: "Efficiency",
		icon: Gauge,
		roles: ["admin", "manager"]
	},
	{
		to: "/app/codes",
		label: "Code book",
		icon: BookOpen,
		roles: [
			"admin",
			"manager",
			"technician"
		]
	},
	{
		to: "/app/parts",
		label: "Parts",
		icon: Package,
		roles: [
			"admin",
			"manager",
			"technician"
		]
	},
	{
		to: "/app/truck",
		label: "Truck stock",
		icon: Truck,
		roles: [
			"admin",
			"manager",
			"technician"
		]
	},
	{
		to: "/app/people",
		label: "People",
		icon: Users,
		roles: ["admin", "manager"]
	},
	{
		to: "/app/schedules",
		label: "Schedules",
		icon: CalendarDays,
		roles: [
			"admin",
			"manager",
			"technician"
		]
	},
	{
		to: "/app/reports",
		label: "Reports",
		icon: Activity,
		roles: ["admin", "manager"]
	},
	{
		to: "/app/audit",
		label: "Audit",
		icon: ScrollText,
		roles: ["admin", "manager"]
	},
	{
		to: "/app/settings",
		label: "Settings",
		icon: Settings,
		roles: ["admin"]
	}
];
var MOBILE_TECH = [
	{
		to: "/app/field",
		label: "Today",
		icon: MapPin
	},
	{
		to: "/app/jobs",
		label: "Jobs",
		icon: ClipboardList
	},
	{
		to: "/app/timecards",
		label: "Hours",
		icon: LayoutGrid
	},
	{
		to: "/app/parts",
		label: "Parts",
		icon: Package
	}
];
function AppShell({ children, role, name, tracking }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [open, setOpen] = (0, import_react.useState)(false);
	const items = (0, import_react.useMemo)(() => NAV.filter((n) => n.roles.includes(role)), [role]);
	const { isPending } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-16 items-center gap-2 px-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-8 place-items-center rounded-md bg-elevated text-primary shadow-[var(--shadow-border)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "leading-tight",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-semibold tracking-tight",
								children: "Field Ledger"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted",
								children: "Maichle's Edge"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex-1 overflow-y-auto px-3 pb-4",
						children: items.map((item) => {
							const active = pathname === item.to || item.to !== "/app" && pathname.startsWith(item.to);
							const Icon = item.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								className: cn("mb-0.5 flex h-10 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150", active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 shrink-0" }), item.label]
							}, item.to);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-border p-3",
						children: [
							tracking ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 flex items-center gap-2 rounded-md bg-ok/10 px-2 py-1.5 text-[11px] text-ok",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-ok" }), "Location tracking active"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-2 text-[11px] text-subtle",
								children: "Location tracking idle"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted",
								children: name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] uppercase tracking-wide text-subtle",
								children: role
							}),
							role !== "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/login",
								search: { mode: "admin" },
								className: "mt-2 flex h-10 items-center gap-2 rounded-md px-2 text-xs text-muted hover:bg-elevated hover:text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }), "Administrator access"]
							}) : null
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-3 backdrop-blur md:hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "grid size-11 place-items-center",
						onClick: () => setOpen(true),
						"aria-label": "Open menu",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-semibold",
						children: "Field Ledger"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-11" })
				]
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-40 md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute inset-0 bg-bg/70",
					onClick: () => setOpen(false),
					"aria-label": "Close menu"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-y-0 left-0 w-72 bg-surface p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold",
								children: "Menu"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => setOpen(false),
								"aria-label": "Close",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})]
						}),
						items.map((item) => {
							const Icon = item.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								onClick: () => setOpen(false),
								className: "mb-1 flex h-11 items-center gap-2 rounded-md px-2 text-sm text-fg hover:bg-elevated",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
							}, item.to);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 border-t border-border pt-3",
							children: [role !== "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/login",
								search: { mode: "admin" },
								onClick: () => setOpen(false),
								className: "mb-2 flex h-11 items-center gap-2 rounded-md px-2 text-sm text-fg hover:bg-elevated",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }), "Administrator access"]
							}) : null, isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 animate-pulse rounded-md bg-elevated" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
						})
					]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "md:pl-60",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden h-14 items-center justify-between border-b border-border px-6 md:flex",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm text-muted",
						children: "Companion payroll & accountability"
					}), isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-32 animate-pulse rounded-md bg-elevated" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: cn("px-4 py-5 md:px-6", role === "technician" ? "pb-24" : "pb-10"),
					children
				})]
			}),
			role === "technician" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden",
				children: MOBILE_TECH.map((item) => {
					const Icon = item.icon;
					const active = pathname === item.to || pathname.startsWith(item.to);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]", active ? "text-primary" : "text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
					}, item.to);
				})
			}) : null
		]
	});
}
function AppLayout() {
	const { user, isPending } = useCurrentUserState();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const qc = useQueryClient();
	const claimed = (0, import_react.useRef)(false);
	const profile = useQuery({
		queryKey: ["profile"],
		queryFn: () => getSessionProfile(),
		enabled: Boolean(user)
	});
	const claim = useMutation({
		mutationFn: (code) => claimAdministrator({ data: { code } }),
		onSuccess: (res) => {
			clearAdminCode();
			if (!res.alreadyAdmin) toast.success("Administrator access granted");
			qc.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (e) => {
			clearAdminCode();
			claimed.current = false;
			toast.error(e.message);
		}
	});
	(0, import_react.useEffect)(() => {
		if (!user || claimed.current) return;
		const code = peekAdminCode();
		if (!code) return;
		claimed.current = true;
		claim.mutate(code);
	}, [user]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-dvh place-items-center bg-bg text-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-40 animate-pulse rounded-md bg-elevated" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	const role = profile.data?.employee.role ?? "technician";
	const name = profile.data?.employee.name ?? user.displayName ?? "Field user";
	const isField = pathname.startsWith("/app/field");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		role,
		name,
		tracking: isField,
		children: profile.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-32 animate-pulse rounded-xl bg-surface" }) : profile.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-danger",
			children: profile.error.message
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
//#endregion
export { AppLayout as component };
