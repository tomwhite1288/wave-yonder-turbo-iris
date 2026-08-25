import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as createFileRoute, d as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, u as Scripts, v as createRootRoute, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, r as QueryClientProvider } from "../_libs/react+tanstack__react-query.mjs";
import { s as __exportAll } from "./ssr.mjs";
import { E as writeAudit, S as num, h as getSql, x as newId, y as loadSettings } from "./session.server-DEz6QvgN.mjs";
import { a as hoursFromEntries, c as loadEntries, o as hydrateToday, u as loadTickets } from "./hydrate.server-GLJsv2Jg.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { n as auth } from "./server-lXD2ZdYx.mjs";
import { a as TriangleAlert } from "../_libs/lucide-react.mjs";
import { createHash } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BVfsnTiD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-CupgvJxC.css";
var APP_NAME = "Field Ledger";
var Route$22 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Payroll, timecard, GPS accountability, and invoice-code validation for Maichle's Edge field technicians."
			},
			{
				name: "theme-color",
				content: "#0B0E11"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	const [queryClient] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		staleTime: 8e3,
		refetchOnWindowFocus: true,
		retry: 1
	} } }));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
					client: queryClient,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
						theme: "dark",
						position: "top-center",
						richColors: true
					})] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$18 = () => import("./routes-DsXXQhQV.mjs");
var Route$21 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$18, "component") });
var $$splitComponentImporter$17 = () => import("./route-Boce1WW9.mjs");
var Route$20 = createFileRoute("/app")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
var $$splitComponentImporter$16 = () => import("./login-Cumzei0c.mjs");
var Route$19 = createFileRoute("/login")({
	validateSearch: (s) => s.mode === "admin" ? { mode: "admin" } : {},
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./app-BFD81puF.mjs");
var Route$18 = createFileRoute("/app/")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
var $$splitComponentImporter$14 = () => import("./audit-0yf1Vjna.mjs");
var Route$17 = createFileRoute("/app/audit")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./codes-DCCZuBwp.mjs");
var Route$16 = createFileRoute("/app/codes")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./efficiency-BP4jHnIk.mjs");
var Route$15 = createFileRoute("/app/efficiency")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./exceptions-B57HqKn0.mjs");
var Route$14 = createFileRoute("/app/exceptions")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./field-DEV59-ou.mjs");
var Route$13 = createFileRoute("/app/field")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./jobs-CqRkA2MH.mjs");
var Route$12 = createFileRoute("/app/jobs")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./parts-CtOKQ6X_.mjs");
var Route$11 = createFileRoute("/app/parts")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./payroll-Bb6wNmgR.mjs");
var Route$10 = createFileRoute("/app/payroll")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./people-BomdqGSV.mjs");
var Route$9 = createFileRoute("/app/people")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./reports-NwpXpwcD.mjs");
var Route$8 = createFileRoute("/app/reports")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./schedules-Ch9avLhj.mjs");
var Route$7 = createFileRoute("/app/schedules")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./settings-KROR3Zwk.mjs");
var Route$6 = createFileRoute("/app/settings")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./timecards-hq9Ae9Ae.mjs");
var Route$5 = createFileRoute("/app/timecards")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./truck-BvmRRMw0.mjs");
var Route$4 = createFileRoute("/app/truck")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var Route$3 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var DEMO_KEY = "fld_demo_maichles_edge_2026";
function hashKey(raw) {
	return createHash("sha256").update(raw).digest("hex");
}
async function authorizeIntegration(request) {
	const raw = request.headers.get("x-field-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
	if (!raw) return null;
	const sql = await getSql();
	const rows = await sql`
    select company_id, id from api_keys where key_hash = ${hashKey(raw)} and active = true limit 1
  `;
	if (rows[0]) {
		await sql`update api_keys set last_used_at = now() where id = ${rows[0].id}`;
		return rows[0].company_id;
	}
	if (raw === DEMO_KEY) return "co_maichles";
	return null;
}
async function ingestTicket(companyId, payload) {
	if (!payload.ticketNumber) throw new Error("ticketNumber is required");
	const sql = await getSql();
	await hydrateToday(companyId);
	let techId = payload.technicianId ?? null;
	if (!techId && payload.technicianEmail) techId = (await sql`
      select id from employees where company_id = ${companyId} and lower(email) = ${payload.technicianEmail.toLowerCase()}
    `)[0]?.id ?? null;
	const existing = await sql`
    select id from tickets where company_id = ${companyId} and ticket_number = ${payload.ticketNumber}
  `;
	const id = existing[0]?.id ?? newId("tkt");
	const address = payload.address ?? "Address pending";
	if (existing[0]) await sql`
      update tickets set
        customer_name = coalesce(${payload.customer ?? null}, customer_name),
        address_line = coalesce(${payload.address ?? null}, address_line),
        lat = coalesce(${payload.lat ?? null}, lat),
        lng = coalesce(${payload.lng ?? null}, lng),
        technician_id = coalesce(${techId}, technician_id),
        scheduled_start = coalesce(${payload.scheduledStart ?? null}, scheduled_start),
        scheduled_end = coalesce(${payload.scheduledEnd ?? null}, scheduled_end),
        invoice_number = coalesce(${payload.invoiceNumber ?? null}, invoice_number),
        invoice_amount = coalesce(${payload.invoiceAmount ?? null}, invoice_amount),
        labor_amount = coalesce(${payload.laborAmount ?? null}, labor_amount),
        parts_amount = coalesce(${payload.partsAmount ?? null}, parts_amount),
        source = 'api',
        updated_at = now()
      where id = ${id}
    `;
	else await sql`
      insert into tickets (
        id, company_id, ticket_number, customer_name, address_line, city, state, zip,
        lat, lng, scheduled_start, scheduled_end, technician_id, invoice_number,
        invoice_amount, labor_amount, parts_amount, status, source
      ) values (
        ${id}, ${companyId}, ${payload.ticketNumber}, ${payload.customer ?? "Imported customer"},
        ${address}, ${payload.city ?? "New Castle"}, ${payload.state ?? "DE"}, ${payload.zip ?? "19720"},
        ${payload.lat ?? null}, ${payload.lng ?? null}, ${payload.scheduledStart ?? null},
        ${payload.scheduledEnd ?? null}, ${techId}, ${payload.invoiceNumber ?? null},
        ${payload.invoiceAmount ?? 0}, ${payload.laborAmount ?? 0}, ${payload.partsAmount ?? 0},
        'scheduled', 'api'
      )
    `;
	if (payload.codes) {
		await sql`delete from ticket_codes where ticket_id = ${id}`;
		const book = await sql`
      select code, hours, labor_value from code_book where company_id = ${companyId}
    `;
		const map = new Map(book.map((c) => [c.code, c]));
		for (const code of payload.codes) {
			const def = map.get(code);
			await sql`
        insert into ticket_codes (id, ticket_id, code, hours_expected, labor_value)
        values (${newId("tc")}, ${id}, ${code}, ${def?.hours ?? 0}, ${def?.labor_value ?? 0})
      `;
			if (!def) await sql`
          insert into exceptions (id, company_id, employee_id, ticket_id, kind, severity, message, status)
          select ${newId("ex")}, ${companyId}, coalesce(${techId}, (select id from employees where company_id = ${companyId} and role = 'admin' limit 1)),
            ${id}, 'invalid_code', 'warning', ${`Invoice contains code ${code} not found in the Code Book.`}, 'open'
        `;
		}
	}
	await writeAudit({
		companyId,
		actorName: "Integration API",
		action: "ingest_ticket",
		entityType: "ticket",
		entityId: id,
		ticketId: id,
		newValue: payload
	});
	return {
		id,
		ticketNumber: payload.ticketNumber
	};
}
async function ticketAccountability(companyId, ticketNumber) {
	const settings = await loadSettings(companyId);
	const ticket = (await loadTickets(companyId, settings.gpsRadiusFt)).find((t) => t.ticketNumber === ticketNumber);
	if (!ticket) return null;
	const mine = (await loadEntries({
		companyId,
		fromIso: "2000-01-01T00:00:00Z",
		toIso: "2100-01-01T00:00:00Z"
	})).filter((e) => e.ticketId === ticket.id);
	const hours = hoursFromEntries(mine);
	const sql = await getSql();
	const exceptions = await sql`
    select kind, message, status from exceptions where ticket_id = ${ticket.id}
  `;
	const gps = await sql`
    select status, distance_ft, recorded_at from gps_events
    where ticket_id = ${ticket.id} order by recorded_at desc limit 1
  `;
	return {
		ticketNumber: ticket.ticketNumber,
		technicianTime: {
			billableHours: hours.billable / 60,
			nonBillableHours: hours.nonBillable / 60,
			travelHours: hours.travel / 60,
			workedHours: hours.worked / 60
		},
		gpsAttendance: gps[0] ? {
			status: gps[0].status,
			distanceFt: gps[0].distance_ft == null ? null : num(gps[0].distance_ft),
			at: gps[0].recorded_at
		} : {
			status: "OFFLINE",
			distanceFt: null,
			at: null
		},
		expectedHours: ticket.expectedHours,
		codes: ticket.codes,
		exceptions,
		invoice: {
			number: ticket.invoiceNumber,
			amount: ticket.invoiceAmount
		}
	};
}
var Route$2 = createFileRoute("/api/integration/tickets")({ server: { handlers: { POST: async ({ request }) => {
	const companyId = await authorizeIntegration(request);
	if (!companyId) return new Response(JSON.stringify({ error: "Unauthorized" }), {
		status: 401,
		headers: { "content-type": "application/json" }
	});
	try {
		const result = await ingestTicket(companyId, await request.json());
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { "content-type": "application/json" }
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Bad request" }), {
			status: 400,
			headers: { "content-type": "application/json" }
		});
	}
} } } });
var $$splitComponentImporter = () => import("./jobs._ticketId-Z0kRKKVs.mjs");
var Route$1 = createFileRoute("/app/jobs/$ticketId")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route = createFileRoute("/api/integration/tickets/$ticketNumber")({ server: { handlers: { GET: async ({ request, params }) => {
	const companyId = await authorizeIntegration(request);
	if (!companyId) return new Response(JSON.stringify({ error: "Unauthorized" }), {
		status: 401,
		headers: { "content-type": "application/json" }
	});
	const result = await ticketAccountability(companyId, params.ticketNumber);
	if (!result) return new Response(JSON.stringify({ error: "Not found" }), {
		status: 404,
		headers: { "content-type": "application/json" }
	});
	return new Response(JSON.stringify(result), {
		status: 200,
		headers: { "content-type": "application/json" }
	});
} } } });
var IndexRoute = Route$21.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$22
});
var AppRouteRoute = Route$20.update({
	id: "/app",
	path: "/app",
	getParentRoute: () => Route$22
});
var LoginRoute = Route$19.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$22
});
var AppIndexRoute = Route$18.update({
	id: "/",
	path: "/",
	getParentRoute: () => AppRouteRoute
});
var AppAuditRoute = Route$17.update({
	id: "/audit",
	path: "/audit",
	getParentRoute: () => AppRouteRoute
});
var AppCodesRoute = Route$16.update({
	id: "/codes",
	path: "/codes",
	getParentRoute: () => AppRouteRoute
});
var AppEfficiencyRoute = Route$15.update({
	id: "/efficiency",
	path: "/efficiency",
	getParentRoute: () => AppRouteRoute
});
var AppExceptionsRoute = Route$14.update({
	id: "/exceptions",
	path: "/exceptions",
	getParentRoute: () => AppRouteRoute
});
var AppFieldRoute = Route$13.update({
	id: "/field",
	path: "/field",
	getParentRoute: () => AppRouteRoute
});
var AppJobsRoute = Route$12.update({
	id: "/jobs",
	path: "/jobs",
	getParentRoute: () => AppRouteRoute
});
var AppPartsRoute = Route$11.update({
	id: "/parts",
	path: "/parts",
	getParentRoute: () => AppRouteRoute
});
var AppPayrollRoute = Route$10.update({
	id: "/payroll",
	path: "/payroll",
	getParentRoute: () => AppRouteRoute
});
var AppPeopleRoute = Route$9.update({
	id: "/people",
	path: "/people",
	getParentRoute: () => AppRouteRoute
});
var AppReportsRoute = Route$8.update({
	id: "/reports",
	path: "/reports",
	getParentRoute: () => AppRouteRoute
});
var AppSchedulesRoute = Route$7.update({
	id: "/schedules",
	path: "/schedules",
	getParentRoute: () => AppRouteRoute
});
var AppSettingsRoute = Route$6.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AppRouteRoute
});
var AppTimecardsRoute = Route$5.update({
	id: "/timecards",
	path: "/timecards",
	getParentRoute: () => AppRouteRoute
});
var AppTruckRoute = Route$4.update({
	id: "/truck",
	path: "/truck",
	getParentRoute: () => AppRouteRoute
});
var ApiAuthSplatRoute = Route$3.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$22
});
var ApiIntegrationTicketsRoute = Route$2.update({
	id: "/api/integration/tickets",
	path: "/api/integration/tickets",
	getParentRoute: () => Route$22
});
var AppJobsTicketIdRoute = Route$1.update({
	id: "/$ticketId",
	path: "/$ticketId",
	getParentRoute: () => AppJobsRoute
});
var ApiIntegrationTicketsTicketNumberRoute = Route.update({
	id: "/$ticketNumber",
	path: "/$ticketNumber",
	getParentRoute: () => ApiIntegrationTicketsRoute
});
var AppJobsRouteChildren = { AppJobsTicketIdRoute };
var AppRouteRouteChildren = {
	AppAuditRoute,
	AppCodesRoute,
	AppEfficiencyRoute,
	AppExceptionsRoute,
	AppFieldRoute,
	AppJobsRoute: AppJobsRoute._addFileChildren(AppJobsRouteChildren),
	AppPartsRoute,
	AppPayrollRoute,
	AppPeopleRoute,
	AppReportsRoute,
	AppSchedulesRoute,
	AppSettingsRoute,
	AppTimecardsRoute,
	AppTruckRoute,
	AppIndexRoute
};
var AppRouteRouteWithChildren = AppRouteRoute._addFileChildren(AppRouteRouteChildren);
var ApiIntegrationTicketsRouteChildren = { ApiIntegrationTicketsTicketNumberRoute };
var rootRouteChildren = {
	IndexRoute,
	AppRouteRoute: AppRouteRouteWithChildren,
	LoginRoute,
	ApiAuthSplatRoute,
	ApiIntegrationTicketsRoute: ApiIntegrationTicketsRoute._addFileChildren(ApiIntegrationTicketsRouteChildren)
};
var routeTree = Route$22._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Route$1 as n, Route$19 as r, router_exports as t };
