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
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { Role } from "@/lib/field/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const NAV = [
  { to: "/app", label: "Board", icon: Radio, roles: ["admin", "manager"] as Role[] },
  { to: "/app/field", label: "Today", icon: MapPin, roles: ["admin", "manager", "technician"] as Role[] },
  { to: "/app/jobs", label: "Jobs", icon: ClipboardList, roles: ["admin", "manager", "technician"] as Role[] },
  { to: "/app/timecards", label: "Timecards", icon: LayoutGrid, roles: ["admin", "manager", "technician"] as Role[] },
  { to: "/app/exceptions", label: "Exceptions", icon: ShieldAlert, roles: ["admin", "manager", "technician"] as Role[] },
  { to: "/app/payroll", label: "Payroll", icon: Wallet, roles: ["admin", "manager"] as Role[] },
  { to: "/app/efficiency", label: "Efficiency", icon: Gauge, roles: ["admin", "manager"] as Role[] },
  { to: "/app/codes", label: "Code book", icon: BookOpen, roles: ["admin", "manager", "technician"] as Role[] },
  { to: "/app/parts", label: "Parts", icon: Package, roles: ["admin", "manager", "technician"] as Role[] },
  { to: "/app/truck", label: "Truck stock", icon: Truck, roles: ["admin", "manager", "technician"] as Role[] },
  { to: "/app/people", label: "People", icon: Users, roles: ["admin", "manager"] as Role[] },
  { to: "/app/schedules", label: "Schedules", icon: CalendarDays, roles: ["admin", "manager", "technician"] as Role[] },
  { to: "/app/reports", label: "Reports", icon: Activity, roles: ["admin", "manager"] as Role[] },
  { to: "/app/audit", label: "Audit", icon: ScrollText, roles: ["admin", "manager"] as Role[] },
  { to: "/app/settings", label: "Settings", icon: Settings, roles: ["admin"] as Role[] },
];

const MOBILE_TECH = [
  { to: "/app/field", label: "Today", icon: MapPin },
  { to: "/app/jobs", label: "Jobs", icon: ClipboardList },
  { to: "/app/timecards", label: "Hours", icon: LayoutGrid },
  { to: "/app/parts", label: "Parts", icon: Package },
];

export function AppShell({
  children,
  role,
  name,
  tracking,
}: {
  children: ReactNode;
  role: Role;
  name: string;
  tracking?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const items = useMemo(() => NAV.filter((n) => n.roles.includes(role)), [role]);
  const { isPending } = useCurrentUserState();

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface md:flex">
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
            const Icon = item.icon;
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

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-3 backdrop-blur md:hidden">
        <button type="button" className="grid size-11 place-items-center" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <div className="text-sm font-semibold">Field Ledger</div>
        <span className="w-11" />
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-bg/70" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-72 bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold">Menu</div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>
            {items.map((item) => {
              const Icon = item.icon;
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
              {role !== "admin" ? (
                <Link
                  to="/login"
                  search={{ mode: "admin" }}
                  onClick={() => setOpen(false)}
                  className="mb-2 flex h-11 items-center gap-2 rounded-md px-2 text-sm text-fg hover:bg-elevated"
                >
                  <ShieldCheck className="size-4" />
                  Administrator access
                </Link>
              ) : null}
              {isPending ? <div className="h-8 animate-pulse rounded-md bg-elevated" /> : <UserButton />}
            </div>
          </div>
        </div>
      ) : null}

      <div className="md:pl-60">
        <div className="hidden h-14 items-center justify-between border-b border-border px-6 md:flex">
          <div className="text-sm text-muted">Companion payroll & accountability</div>
          {isPending ? <div className="h-8 w-32 animate-pulse rounded-md bg-elevated" /> : <UserButton />}
        </div>
        <main className={cn("px-4 py-5 md:px-6", role === "technician" ? "pb-24" : "pb-10")}>{children}</main>
      </div>

      {role === "technician" ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
          {MOBILE_TECH.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || pathname.startsWith(item.to);
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
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
