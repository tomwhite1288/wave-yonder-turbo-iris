import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { f as useRouterState, h as Outlet, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { D as navForRole, f as cn, p as dockForRole } from "./session.server-DT32kkW4.mjs";
import { t as Button } from "./button-3OtcC0YW.mjs";
import { t as Card } from "./card-L2k1Mubk.mjs";
import { a as getSessionProfile } from "./api-D-PkeQOG.mjs";
import { C as CalendarDays, E as Activity, _ as LayoutGrid, b as ClipboardList, c as ShieldAlert, d as Radio, g as MapPin, i as Truck, l as Settings, m as Menu, n as Wallet, p as Package, r as Users, s as ShieldCheck, t as X, u as ScrollText, w as BookOpen, y as Gauge } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as claimAdministrator } from "./api-admin-CpHWMZW0.mjs";
import { a as useCurrentUserState, i as UserButton, t as RedirectToSignIn } from "./gates-B_IGPI9u.mjs";
import { n as peekAdminCode, t as clearAdminCode } from "./admin-login-DELCrQro.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-B_aMaDIu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ICONS = {
	board: Radio,
	field: MapPin,
	jobs: ClipboardList,
	timecards: LayoutGrid,
	exceptions: ShieldAlert,
	payroll: Wallet,
	efficiency: Gauge,
	codes: BookOpen,
	parts: Package,
	truck: Truck,
	people: Users,
	schedules: CalendarDays,
	reports: Activity,
	audit: ScrollText,
	settings: Settings
};
function AppShell({ children, role, name, tracking, settings }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [open, setOpen] = (0, import_react.useState)(false);
	const items = (0, import_react.useMemo)(() => navForRole(role, settings?.roleNav), [role, settings?.roleNav]);
	const dock = (0, import_react.useMemo)(() => dockForRole(role, settings?.mobileDock, settings?.roleNav), [role, settings]);
	const { isPending } = useCurrentUserState();
	const layout = settings?.layoutMode ?? "auto";
	const forceDesktop = layout === "desktop";
	const forceMobile = layout === "mobile";
	const showDock = forceMobile || !forceDesktop && (role === "technician" || true);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("min-h-dvh bg-bg text-fg", forceDesktop && "layout-desktop", forceMobile && "layout-mobile"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("fixed inset-y-0 left-0 z-30 w-60 flex-col border-r border-border bg-surface", forceMobile ? "hidden" : "hidden md:flex", forceDesktop && "!flex"),
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
							const Icon = ICONS[item.id];
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
				className: cn("sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-3 backdrop-blur", forceDesktop ? "hidden" : "md:hidden"),
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
				className: "fixed inset-0 z-40",
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
							const Icon = ICONS[item.id];
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
				className: cn(forceMobile ? "pl-0" : "md:pl-60", forceDesktop && "!pl-60"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("h-14 items-center justify-between border-b border-border px-6", forceMobile ? "hidden" : "hidden md:flex", forceDesktop && "!flex"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm text-muted",
						children: "Companion payroll, dispatch & accountability"
					}), isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-32 animate-pulse rounded-md bg-elevated" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: cn("px-4 py-5 md:px-6", showDock && !forceDesktop ? "pb-24 md:pb-10" : "pb-10", forceMobile && "pb-24"),
					children
				})]
			}),
			showDock && !forceDesktop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: cn("fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]", forceMobile ? "flex" : "flex md:hidden"),
				children: dock.map((item) => {
					const Icon = ICONS[item.id];
					const active = pathname === item.to || item.to !== "/app" && pathname.startsWith(item.to);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]", active ? "text-primary" : "text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.dockLabel]
					}, item.to);
				})
			}) : null
		]
	});
}
function PendingGate({ name }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-dvh place-items-center bg-bg px-4 text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "w-full max-w-md space-y-4 p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-wide text-subtle",
					children: "Field Ledger"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "Waiting for approval"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [name, ", your login is on file. An administrator has to approve this account before you can open jobs, the clock, or the dispatch desk."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center pt-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
				})
			]
		})
	});
}
function SignupClosed({ title, message }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-dvh place-items-center bg-bg px-4 text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "w-full max-w-md space-y-4 p-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: title ?? "Sign-in is closed"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: message
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center pt-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
				})
			]
		})
	});
}
function ThemeApplier({ theme, layout }) {
	(0, import_react.useEffect)(() => {
		const root = document.documentElement;
		if (theme) root.dataset.theme = theme;
		else delete root.dataset.theme;
		if (layout) root.dataset.layout = layout;
		else delete root.dataset.layout;
	}, [theme, layout]);
	return null;
}
function AppLayout() {
	const { user, isPending } = useCurrentUserState();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const qc = useQueryClient();
	const claimed = (0, import_react.useRef)(false);
	const profile = useQuery({
		queryKey: ["profile"],
		queryFn: () => getSessionProfile(),
		enabled: Boolean(user),
		retry: false
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
	if (profile.error) {
		const msg = profile.error.message || "Could not load this account";
		const closed = /turned off|sign-in is closed|approve your account/i.test(msg);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignupClosed, {
			title: closed ? "Sign-in is closed" : "Could not open Field Ledger",
			message: msg
		});
	}
	const emp = profile.data?.employee;
	const settings = profile.data?.settings;
	const role = emp?.role ?? "technician";
	const name = emp?.name ?? user.displayName ?? "Field user";
	const isField = pathname.startsWith("/app/field");
	const unlocking = Boolean(peekAdminCode()) || claim.isPending || claim.isSuccess;
	if (emp && emp.accountStatus !== "active" && role !== "admin") {
		if (unlocking) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid min-h-dvh place-items-center bg-bg text-muted",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: "Unlocking administrator access…"
			})
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeApplier, {
			theme: settings?.themeId,
			layout: settings?.layoutMode
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PendingGate, { name })] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeApplier, {
		theme: settings?.themeId,
		layout: settings?.layoutMode
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		role,
		name,
		tracking: isField,
		settings,
		children: profile.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-32 animate-pulse rounded-xl bg-surface" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	})] });
}
//#endregion
export { AppLayout as component };
