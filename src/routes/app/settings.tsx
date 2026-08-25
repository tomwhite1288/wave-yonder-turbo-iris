import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getSettings, saveSettings } from "@/lib/field/api-ops";
import { getAdminEmails, saveAdminEmails, setAdminAccessCode } from "@/lib/field/api-admin";
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
