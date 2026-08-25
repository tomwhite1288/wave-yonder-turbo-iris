import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getSettings, saveSettings } from "@/lib/field/api-ops";
import { getAdminEmails, saveAdminEmails, setAdminAccessCode } from "@/lib/field/api-admin";
import { DEFAULT_ROLE_NAV, NAV_CATALOG, THEMES } from "@/lib/field/nav";
import type { NavId, Role } from "@/lib/field/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const emailsQ = useQuery({
    queryKey: ["admin-emails"],
    queryFn: () => getAdminEmails(),
    enabled: q.data?.profile.employee.role === "admin",
  });
  const mut = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast.success("Settings saved");
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["dispatch"] });
    },
  });
  const codeMut = useMutation({
    mutationFn: setAdminAccessCode,
    onSuccess: () => {
      toast.success("Administrator code updated");
      setCurrentCode("");
      setNextCode("");
      void qc.invalidateQueries({ queryKey: ["admin-login-meta"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const emailMut = useMutation({
    mutationFn: saveAdminEmails,
    onSuccess: () => {
      toast.success("Admin emails saved");
      void qc.invalidateQueries({ queryKey: ["admin-emails"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const s = q.data?.profile.settings;
  const [radius, setRadius] = useState<string>();
  const [tolerance, setTolerance] = useState<string>();
  const [ot, setOt] = useState<string>();
  const [labor, setLabor] = useState<string>();
  const [currentCode, setCurrentCode] = useState("");
  const [nextCode, setNextCode] = useState("");
  const [emails, setEmails] = useState<string>();

  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  if (!s) return null;
  if (q.data?.profile.employee.role !== "admin") {
    return <p className="text-sm text-muted">Administrator access required.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System configuration</h1>
        <p className="text-sm text-muted">Change company rules here — not in source code.</p>
      </div>

      <Card className="space-y-4 rounded-2xl p-5">
        <div>
          <h2 className="text-sm font-semibold">Administrator access</h2>
          <p className="mt-1 text-sm text-muted">
            The Administrator button on sign-in requires this code. After a successful unlock, that Google or email
            login is promoted to admin. Bind your Gmail below so it stays admin on the next sign-in.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">Current code</span>
            <Input
              type="password"
              autoComplete="off"
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              placeholder={s.adminHintVisible ? "EDGE-ADMIN" : "Current code"}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">New code</span>
            <Input
              type="password"
              autoComplete="off"
              value={nextCode}
              onChange={(e) => setNextCode(e.target.value)}
              placeholder="At least 6 characters"
            />
          </label>
        </div>
        <Button
          type="button"
          disabled={codeMut.isPending || currentCode.trim().length < 6 || nextCode.trim().length < 6}
          onClick={() => codeMut.mutate({ data: { currentCode, nextCode } })}
        >
          {codeMut.isPending ? "Saving…" : "Change admin code"}
        </Button>

        <label className="block text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">Auto-admin emails</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            value={emails ?? (emailsQ.data?.emails ?? s.adminEmails).join("\n")}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="you@gmail.com"
          />
          <span className="mt-1 block text-xs text-muted">One email per line. Those logins become administrator automatically.</span>
        </label>
        <Button
          type="button"
          variant="secondary"
          disabled={emailMut.isPending}
          onClick={() =>
            emailMut.mutate({
              data: { emails: emails ?? (emailsQ.data?.emails ?? s.adminEmails).join("\n") },
            })
          }
        >
          Save admin emails
        </Button>
      </Card>

      <Card className="grid gap-3 sm:grid-cols-2">
        <Field label="Job-site GPS radius (ft)" value={radius ?? String(s.gpsRadiusFt)} onChange={setRadius} />
        <Field label="Exception tolerance (min)" value={tolerance ?? String(s.exceptionToleranceMin)} onChange={setTolerance} />
        <Field label="Daily overtime after (hours)" value={ot ?? String(s.overtimeDailyHours)} onChange={setOt} />
        <Field label="Default labor rate" value={labor ?? String(s.laborRate)} onChange={setLabor} />
        <div className="sm:col-span-2">
          <Button
            onClick={() =>
              mut.mutate({
                data: {
                  gps_radius_ft: Number(radius ?? s.gpsRadiusFt),
                  exception_tolerance_min: Number(tolerance ?? s.exceptionToleranceMin),
                  overtime_daily_hours: Number(ot ?? s.overtimeDailyHours),
                  labor_rate: Number(labor ?? s.laborRate),
                },
              })
            }
          >
            Save rules
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Theme</h2>
        <p className="text-xs text-muted">Stock is the current industrial look. Field Blue matches the main Maichle’s Edge desk.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => mut.mutate({ data: { theme_id: t.id } })}
              className={`rounded-md px-3 py-3 text-left shadow-[var(--shadow-border)] ${s.themeId === t.id ? "bg-primary text-primary-fg" : "bg-elevated text-fg"}`}
            >
              <div className="text-sm font-medium">{t.label}</div>
              <div className={`text-xs ${s.themeId === t.id ? "text-primary-fg/80" : "text-muted"}`}>{t.hint}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Computer vs phone</h2>
        <p className="text-xs text-muted">Computer is the full-width dispatch desk. Phone uses the bottom dock. Auto follows the device.</p>
        <div className="grid grid-cols-3 gap-2">
          {(["auto", "desktop", "mobile"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => mut.mutate({ data: { layout_mode: m } })}
              className={`h-11 rounded-md text-sm capitalize ${s.layoutMode === m ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`}
            >
              {m === "auto" ? "Auto" : m === "desktop" ? "Computer" : "Phone"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.dispatchShowMap}
            onChange={(e) => mut.mutate({ data: { dispatch_show_map: e.target.checked } })}
          />
          Show live map on the computer dispatch board
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.dispatchShowTiles}
            onChange={(e) => mut.mutate({ data: { dispatch_show_tiles: e.target.checked } })}
          />
          Show KPI tiles above the computer board
        </label>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Phone dock</h2>
        <p className="text-xs text-muted">Up to five tabs on the technician bottom bar. Order is left to right.</p>
        <DockEditor
          value={s.mobileDock}
          onSave={(ids) => mut.mutate({ data: { mobile_dock: JSON.stringify(ids) } })}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Role screens</h2>
        <p className="text-xs text-muted">Choose which sidebar items each role can open.</p>
        <RoleNavEditor
          value={s.roleNav}
          onSave={(next) => mut.mutate({ data: { role_nav: JSON.stringify(next) } })}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Sign-in gate</h2>
        <p className="text-xs text-muted">On first setup, new Google/email accounts wait until you approve them on People.</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.signupOpen}
            onChange={(e) => mut.mutate({ data: { signup_open: e.target.checked } })}
          />
          Allow new people to sign in
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.signupRequiresApproval}
            onChange={(e) => mut.mutate({ data: { signup_requires_approval: e.target.checked } })}
          />
          Admin must approve new accounts
        </label>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Integration API</h2>
        <p className="text-sm text-muted">
          Independent of the primary platform schema. Send tickets in; receive time, GPS status, exceptions, and
          validated hours. Header: <span className="font-mono text-fg">X-Field-Key</span>
        </p>
        <pre className="overflow-x-auto rounded-lg bg-elevated p-3 font-mono text-xs text-muted">
{`POST /api/integration/tickets
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

GET /api/integration/tickets/123499`}
        </pre>
      </Card>

      <Card className="space-y-2 text-sm text-muted">
        <h2 className="text-sm font-semibold text-fg">Architecture</h2>
        <p>Primary platform → ticket/invoice/customer payload → integration API → Field Ledger engines (time, GPS, codes, payroll, efficiency) → admin board / technician mobile.</p>
        <p>Auth: Better Auth (Google, X, email). Roles: admin, manager, technician. GPS is attendance evidence. Historical pay rates and original punches are never overwritten.</p>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function DockEditor({ value, onSave }: { value: NavId[]; onSave: (ids: NavId[]) => void }) {
  const [ids, setIds] = useState<NavId[]>(value);
  return (
    <div className="space-y-2">
      {NAV_CATALOG.map((item) => {
        const on = ids.includes(item.id);
        return (
          <label key={item.id} className="flex h-11 items-center gap-2 rounded-md px-2 hover:bg-elevated">
            <input
              type="checkbox"
              checked={on}
              onChange={() => {
                setIds((cur) => {
                  if (cur.includes(item.id)) return cur.filter((x) => x !== item.id);
                  if (cur.length >= 5) return cur;
                  return [...cur, item.id];
                });
              }}
            />
            <span className="text-sm">{item.label}</span>
            <span className="ml-auto text-xs text-subtle">{item.dockLabel}</span>
          </label>
        );
      })}
      <Button size="sm" onClick={() => onSave(ids.slice(0, 5))}>Save dock</Button>
    </div>
  );
}

function RoleNavEditor({
  value,
  onSave,
}: {
  value: Partial<Record<Role, NavId[]>>;
  onSave: (next: Partial<Record<Role, NavId[]>>) => void;
}) {
  const [next, setNext] = useState<Partial<Record<Role, NavId[]>>>(value);
  const roles: Role[] = ["technician", "manager", "admin"];
  return (
    <div className="space-y-4">
      {roles.map((role) => {
        const ids = next[role] ?? DEFAULT_ROLE_NAV[role];
        return (
          <div key={role}>
            <p className="mb-1 text-xs uppercase tracking-wide text-subtle">{role}</p>
            <div className="flex flex-wrap gap-2">
              {NAV_CATALOG.filter((n) => n.roles.includes(role)).map((n) => {
                const on = ids.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() =>
                      setNext((cur) => {
                        const list = cur[role] ?? DEFAULT_ROLE_NAV[role];
                        const has = list.includes(n.id);
                        return { ...cur, [role]: has ? list.filter((x) => x !== n.id) : [...list, n.id] };
                      })
                    }
                    className={`h-9 rounded-md px-2 text-xs ${on ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <Button size="sm" onClick={() => onSave(next)}>Save role screens</Button>
    </div>
  );
}
