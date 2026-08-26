import type { LayoutMode, NavId, Role, ThemeId } from "./types";

export type { NavId, Role, ThemeId, LayoutMode };

export type NavItem = {
  id: NavId;
  to: string;
  label: string;
  dockLabel: string;
  roles: Role[];
};

export const NAV_CATALOG: NavItem[] = [
  { id: "board", to: "/app", label: "Dispatch", dockLabel: "Board", roles: ["admin", "manager"] },
  { id: "field", to: "/app/field", label: "Today", dockLabel: "Today", roles: ["admin", "manager", "technician"] },
  { id: "jobs", to: "/app/jobs", label: "Jobs", dockLabel: "Jobs", roles: ["admin", "manager", "technician"] },
  { id: "timecards", to: "/app/timecards", label: "Timecards", dockLabel: "Hours", roles: ["admin", "manager", "technician"] },
  { id: "exceptions", to: "/app/exceptions", label: "Exceptions", dockLabel: "Flags", roles: ["admin", "manager", "technician"] },
  { id: "payroll", to: "/app/payroll", label: "Payroll", dockLabel: "Pay", roles: ["admin", "manager"] },
  { id: "efficiency", to: "/app/efficiency", label: "Efficiency", dockLabel: "Eff", roles: ["admin", "manager"] },
  { id: "codes", to: "/app/codes", label: "Code book", dockLabel: "Codes", roles: ["admin", "manager", "technician"] },
  { id: "parts", to: "/app/parts", label: "Parts", dockLabel: "Parts", roles: ["admin", "manager", "technician"] },
  { id: "truck", to: "/app/truck", label: "Truck stock", dockLabel: "Truck", roles: ["admin", "manager", "technician"] },
  { id: "people", to: "/app/people", label: "People", dockLabel: "People", roles: ["admin", "manager"] },
  { id: "schedules", to: "/app/schedules", label: "Schedules", dockLabel: "Sked", roles: ["admin", "manager", "technician"] },
  { id: "reports", to: "/app/reports", label: "Reports", dockLabel: "Reports", roles: ["admin", "manager"] },
  { id: "audit", to: "/app/audit", label: "Audit", dockLabel: "Audit", roles: ["admin", "manager"] },
  { id: "settings", to: "/app/settings", label: "Settings", dockLabel: "Setup", roles: ["admin"] },
];

export const DEFAULT_DOCK: NavId[] = ["field", "jobs", "timecards", "codes", "exceptions"];

export const DEFAULT_DOCK_BY_ROLE: Record<Role, NavId[]> = {
  technician: ["field", "jobs", "timecards", "codes", "exceptions"],
  manager: ["board", "exceptions", "efficiency", "jobs", "timecards"],
  admin: ["board", "exceptions", "efficiency", "people", "settings"],
};

export const DEFAULT_ROLE_NAV: Record<Role, NavId[]> = {
  admin: NAV_CATALOG.map((n) => n.id),
  manager: NAV_CATALOG.filter((n) => n.roles.includes("manager")).map((n) => n.id),
  technician: ["field", "jobs", "timecards", "exceptions", "codes", "parts", "truck", "schedules"],
};

export const THEMES: { id: ThemeId; label: string; hint: string }[] = [
  { id: "stock", label: "Stock", hint: "Current industrial dark" },
  { id: "field", label: "Field Blue", hint: "Maichle’s Edge office blue" },
  { id: "night", label: "Night", hint: "Lower contrast after hours" },
  { id: "light", label: "Office light", hint: "Daytime dispatch desk" },
];

export function parseNavList(raw: string | null | undefined, fallback: NavId[]): NavId[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;
    const allowed = new Set(NAV_CATALOG.map((n) => n.id));
    const ids = parsed.filter((x): x is NavId => typeof x === "string" && allowed.has(x as NavId));
    return ids.length ? ids : fallback;
  } catch {
    return fallback;
  }
}

export function parseRoleNav(raw: string | null | undefined): Partial<Record<Role, NavId[]>> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<Record<Role, NavId[]>>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Partial<Record<Role, NavId[]>> = {};
    for (const role of ["admin", "manager", "technician"] as Role[]) {
      if (parsed[role]) out[role] = parseNavList(JSON.stringify(parsed[role]), DEFAULT_ROLE_NAV[role]);
    }
    return out;
  } catch {
    return {};
  }
}

export function navForRole(role: Role, roleNav: Partial<Record<Role, NavId[]>> | undefined): NavItem[] {
  const ids = roleNav?.[role]?.length ? roleNav[role]! : DEFAULT_ROLE_NAV[role];
  const byId = new Map(NAV_CATALOG.map((n) => [n.id, n]));
  return ids.map((id) => byId.get(id)).filter((n): n is NavItem => n != null && n.roles.includes(role));
}

export function dockForRole(
  role: Role,
  mobileDock: NavId[] | undefined,
  roleNav: Partial<Record<Role, NavId[]>> | undefined,
): NavItem[] {
  const allowed = new Set(navForRole(role, roleNav).map((n) => n.id));
  const ids = (role === "technician" && mobileDock?.length ? mobileDock : DEFAULT_DOCK_BY_ROLE[role] ?? DEFAULT_DOCK)
    .filter((id) => allowed.has(id))
    .slice(0, 5);
  const byId = new Map(NAV_CATALOG.map((n) => [n.id, n]));
  return ids.map((id) => byId.get(id)).filter((n): n is NavItem => n != null);
}

export function parseTheme(raw: string | null | undefined): ThemeId {
  if (raw === "field" || raw === "night" || raw === "light" || raw === "stock") return raw;
  return "stock";
}

export function parseLayout(raw: string | null | undefined): LayoutMode {
  if (raw === "desktop" || raw === "mobile" || raw === "auto") return raw;
  return "auto";
}
