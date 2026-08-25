import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getLiveBoard, getSessionProfile } from "@/lib/field/api";
import { GpsBadge } from "@/lib/field/status";
import { formatClock, formatDuration, formatHours } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/")({ component: BoardPage });

function BoardPage() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getSessionProfile() });
  const board = useQuery({
    queryKey: ["board"],
    queryFn: () => getLiveBoard(),
    refetchInterval: 15_000,
    enabled: profile.data?.employee.role !== "technician",
  });

  if (profile.data?.employee.role === "technician") {
    return <Navigate to="/app/field" />;
  }
  if (board.isLoading) return <BoardSkeleton />;
  if (board.error) return <p className="text-sm text-danger">{board.error.message}</p>;
  const data = board.data!;
  const tz = data.profile.settings.timezone;
  const working = data.rows.filter((r) => r.gpsStatus === "WORKING" || r.clockedIn).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live board</h1>
          <p className="text-sm text-muted">
            {working} working · {data.openExceptions} open exceptions · {data.profile.settings.companyName}
          </p>
        </div>
        <p className="font-mono text-xs text-subtle tabular">GPS radius {data.profile.settings.gpsRadiusFt} ft</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Technicians" value={String(data.rows.length)} />
        <Stat label="On a ticket" value={String(data.rows.filter((r) => r.ticket).length)} />
        <Stat label="Open exceptions" value={String(data.openExceptions)} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-subtle">
            <tr className="border-b border-border">
              {["Technician", "Status", "Ticket", "On site", "Billable", "Expected", "Exception", "Duration"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.employee.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.employee.name}</div>
                  <div className="text-xs text-muted">
                    {row.employee.department} · {row.employee.vehicle}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <GpsBadge status={row.gpsStatus} />
                </td>
                <td className="px-4 py-3">
                  {row.ticket ? (
                    <Link to="/app/jobs/$ticketId" params={{ ticketId: row.ticket.id }} className="font-mono text-primary hover:underline">
                      #{row.ticket.ticketNumber}
                    </Link>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                  <div className="max-w-[220px] truncate text-xs text-muted">
                    {row.ticket ? `${row.ticket.customerName} · ${row.ticket.addressLine}` : "No active job"}
                  </div>
                </td>
                <td className="px-4 py-3 tabular">
                  {row.distanceFt != null ? `${Math.round(row.distanceFt)} ft` : "—"}
                  <div className="text-xs text-muted">{row.arrival ? formatClock(row.arrival, tz) : "—"}</div>
                </td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(row.billableHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(row.expectedHours)}</td>
                <td className="px-4 py-3">{row.openExceptions ? `${row.openExceptions} open` : "None"}</td>
                <td className="px-4 py-3 font-mono tabular">{formatDuration(row.durationMin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-[11px] uppercase tracking-wide text-subtle">{label}</div>
      <div className="mt-1 font-mono text-2xl tabular">{value}</div>
    </Card>
  );
}

function BoardSkeleton() {
  return <div className="h-72 animate-pulse rounded-xl bg-surface" />;
}
