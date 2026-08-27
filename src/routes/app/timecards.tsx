import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { approveTimecard } from "@/lib/field/api-ops";
import { getAccountabilityWeek, exportWeekPack } from "@/lib/field/api-account";
import { KIND_LABEL, minutesBetween } from "@/lib/field/calc";
import { formatClock, formatDuration, formatHours, downloadText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/timecards")({ ssr: false, component: TimecardsPage });

function TimecardsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["timecards"], queryFn: () => getAccountabilityWeek({ data: { offsetWeeks: 0 } }) });
  const approve = useMutation({
    mutationFn: approveTimecard,
    onSuccess: () => {
      toast.success("Timecard approved");
      void qc.invalidateQueries({ queryKey: ["timecards"] });
    },
  });
  const exportMut = useMutation({
    mutationFn: () => exportWeekPack(),
    onSuccess: (pack) => {
      downloadText(`timecards-${pack.from}.csv`, pack.csv.timecards, "text/csv");
      downloadText(`payroll-${pack.from}.csv`, pack.csv.payroll, "text/csv");
      downloadText(`jobs-${pack.from}.csv`, pack.csv.jobs, "text/csv");
      toast.success("Week files downloaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { rows, profile, from, to } = q.data!;
  const tz = profile.settings.timezone;
  const canApprove = profile.employee.role !== "technician";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timecards</h1>
          <p className="text-sm text-muted">
            Week {from} – {to}. Paid time is GPS-backed in-transit, show, working, and office only. Cross-check
            punches against assigned invoices and coded hours.
          </p>
        </div>
        {canApprove ? (
          <Button size="sm" variant="secondary" disabled={exportMut.isPending} onClick={() => exportMut.mutate()}>
            Download CSV
          </Button>
        ) : null}
      </div>

      <div className="space-y-4">
        {rows.map((row) => {
          const paid = row.hours.paid / 60;
          const sold = row.soldHours;
          return (
            <section key={row.employee.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{row.employee.name}</div>
                  <div className="text-xs text-muted">
                    {row.employee.employeeNumber} · {row.employee.department}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={row.card?.status === "approved" ? "ok" : "warn"}>{row.card?.status ?? "open"}</Badge>
                  {canApprove ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        approve.mutate({
                          data: { employeeId: row.employee.id, workDate: from, note: "Verified punches vs invoices" },
                        })
                      }
                    >
                      Approve week
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Paid" value={formatHours(paid)} hint="GPS-backed" />
                <Stat label="Unpaid" value={formatHours(row.hours.unpaid / 60)} hint="Not claimed" />
                <Stat label="Sold / codes" value={formatHours(sold)} hint="Invoice allocation" />
                <Stat
                  label="ST efficiency"
                  value={`${Math.round(row.efficiency.billableEfficiency * 100)}%`}
                  hint="Sold ÷ available"
                />
              </div>

              <h3 className="mb-2 text-[11px] uppercase tracking-wide text-subtle">Assigned invoices</h3>
              <ul className="mb-4 space-y-1 text-sm">
                {row.jobs.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-1.5">
                    <Link to="/app/jobs/$ticketId" params={{ ticketId: j.id }} className="font-mono text-primary">
                      #{j.ticketNumber}
                    </Link>
                    <span className="truncate text-muted">{j.customerName}</span>
                    <span className="font-mono text-xs">
                      {j.codes.map((c) => c.code).join("+") || "no code"} · {formatHours(j.expectedHours)}h
                    </span>
                  </li>
                ))}
                {row.jobs.length === 0 ? <li className="text-muted">No invoices assigned this week.</li> : null}
              </ul>

              <h3 className="mb-2 text-[11px] uppercase tracking-wide text-subtle">Punches</h3>
              <ul className="space-y-1 text-sm">
                {row.entries.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-1.5">
                    <span className="min-w-24 text-muted">{KIND_LABEL[e.kind] ?? e.kind}</span>
                    <span className="font-mono text-xs">#{e.ticketNumber ?? "—"}</span>
                    <span className="font-mono tabular">
                      {formatClock(e.clockIn, tz)}–{e.clockOut ? formatClock(e.clockOut, tz) : "open"}
                    </span>
                    <span className="font-mono tabular">{formatDuration(minutesBetween(e.clockIn, e.clockOut))}</span>
                    <Badge tone={e.gpsBacked && e.paidMinutes > 0 ? "ok" : "warn"}>
                      {e.paidMinutes > 0 ? "paid" : "unpaid"}
                    </Badge>
                    {e.adjusted ? <Badge tone="info">adjusted</Badge> : null}
                  </li>
                ))}
                {row.entries.length === 0 ? <li className="text-muted">No punches this week.</li> : null}
              </ul>
            </section>
          );
        })}
        {rows.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No technicians on the roster.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-md bg-elevated px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-subtle">{label}</div>
      <div className="font-mono text-sm tabular">{value}</div>
      <div className="text-[11px] text-subtle">{hint}</div>
    </div>
  );
}
