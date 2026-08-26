import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  ClipboardList,
  Gauge,
  LayoutGrid,
  MapPin,
  Package,
  Radio,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  CalendarDays,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { pinLogout } from "@/lib/field/api-admin";
import type { CompanySettings, Role } from "@/lib/field/types";
import { dockForRole, navForRole, type NavId } from "@/lib/field/nav";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { InboxButtons } from "./messenger";

const ICONS: Record<NavId, LucideIcon> = {
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
  settings: Settings,
};

export function AppShell({
  children,
  role,
  name,
  tracking,
  settings,
}: {
  children: ReactNode;
  role: Role;
  name: string;
  tracking?: boolean;
  settings?: CompanySettings;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const items = useMemo(() => navForRole(role, settings?.roleNav), [role, settings?.roleNav]);
  const dock = useMemo(() => dockForRole(role, settings?.mobileDock, settings?.roleNav), [role, settings]);
  const layout = settings?.layoutMode ?? "auto";
  const forceDesktop = layout === "desktop";
  const forceMobile = layout === "mobile";
  const showDock = forceMobile || (!forceDesktop && (role === "technician" || true));

  return (
    <div className={cn("min-h-dvh bg-bg text-fg", forceDesktop && "layout-desktop", forceMobile && "layout-mobile")}>
      <aside className={cn("fixed inset-y-0 left-0 z-30 w-60 flex-col border-r border-border bg-surface", forceMobile ? "hidden" : "hidden md:flex", forceDesktop && "!flex")}>
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="grid size-8 place-items-center rounded-md bg-elevated text-primary shadow-[var(--shadow-border)]">
            <Radio className="size-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Field Ledger</div>
            <div className="text-[11px] text-muted">Maichle's Edge</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {items.map((item) => {
            const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
            const Icon = ICONS[item.id];
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "mb-0.5 flex h-10 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150",
                  active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          {tracking ? (
            <div className="mb-2 flex items-center gap-2 rounded-md bg-ok/10 px-2 py-1.5 text-[11px] text-ok">
              <span className="size-1.5 rounded-full bg-ok" />
              Location tracking active
            </div>
          ) : (
            <div className="mb-2 text-[11px] text-subtle">Location tracking idle</div>
          )}
          <div className="text-xs text-muted">{name}</div>
          <div className="text-[11px] uppercase tracking-wide text-subtle">{role}</div>
          {role !== "admin" ? (
            <Link
              to="/login"
              search={{ mode: "admin" }}
              className="mt-2 flex h-10 items-center gap-2 rounded-md px-2 text-xs text-muted hover:bg-elevated hover:text-fg"
            >
              <ShieldCheck className="size-4" />
              Administrator access
            </Link>
          ) : null}
        </div>
      </aside>

      <header className={cn("sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-3 backdrop-blur", forceDesktop ? "hidden" : "md:hidden")}>
        <button type="button" className="grid size-11 place-items-center" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <div className="text-sm font-semibold">Field Ledger</div>
        <InboxButtons timezone={settings?.timezone} />
      </header>

      {open ? (
        <div className="fixed inset-0 z-40">
          <button type="button" className="absolute inset-0 bg-bg/70" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-72 bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold">Menu</div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>
            {items.map((item) => {
              const Icon = ICONS[item.id];
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="mb-1 flex h-11 items-center gap-2 rounded-md px-2 text-sm text-fg hover:bg-elevated"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-4 border-t border-border pt-3">
              <ShopSignOut name={name} />
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn(forceMobile ? "pl-0" : "md:pl-60", forceDesktop && "!pl-60")}>
        <div className={cn("h-14 items-center justify-between border-b border-border px-6", forceMobile ? "hidden" : "hidden md:flex", forceDesktop && "!flex")}>
          <div className="text-sm text-muted">Companion payroll, dispatch & accountability</div>
          <div className="flex items-center gap-3">
            <InboxButtons timezone={settings?.timezone} />
            <ShopSignOut name={name} />
          </div>
        </div>
        <main className={cn("px-4 py-5 md:px-6", showDock && !forceDesktop ? "pb-24 md:pb-10" : "pb-10", forceMobile && "pb-24")}>{children}</main>
      </div>

      {showDock && !forceDesktop ? (
        <nav className={cn("fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]", forceMobile ? "flex" : "flex md:hidden")}>
          {dock.map((item) => {
            const Icon = ICONS[item.id];
            const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="size-5" />
                {item.dockLabel}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

function ShopSignOut({ name }: { name: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-elevated text-xs font-medium">
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="truncate text-sm font-medium">{name}</span>
      <button
        type="button"
        disabled={busy}
        className="shrink-0 text-sm text-muted hover:text-fg disabled:opacity-50"
        onClick={() => {
          setBusy(true);
          void pinLogout()
            .then(() => {
              window.location.href = "/login";
            })
            .catch(() => setBusy(false));
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
