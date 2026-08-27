import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listJobs } from "@/lib/field/api";
import { formatClock, formatHours } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/spinner";

export const Route = createFileRoute("/app/jobs")({ ssr: false, component: JobsPage });

function JobsPage() {
  const q = useQuery({ queryKey: ["jobs"], queryFn: () => listJobs() });
  if (q.isLoading) return <Spinner label="Loading jobs…" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { tickets, profile } = q.data!;
  const tz = profile.settings.timezone;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="text-sm text-muted">Ticket numbers from the primary platform or work orders created on the dispatch desk.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {tickets.map((t) => (
          <Link
            key={t.id}
            to="/app/jobs/$ticketId"
            params={{ ticketId: t.id }}
            className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-border-hover)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-mono text-primary">#{t.ticketNumber}</div>
              <div className="flex gap-1">
                {t.jobKind === "callback" ? <Badge tone="warn">Callback</Badge> : null}
                {t.jobKind === "warranty" ? <Badge tone="info">Warranty</Badge> : null}
                <Badge tone={t.status === "in_progress" ? "ok" : t.status === "complete" ? "neutral" : "info"}>
                  {t.status.replaceAll("_", " ")}
                </Badge>
              </div>
            </div>
            <div className="mt-1 font-medium">{t.customerName}</div>
            <div className="text-sm text-muted">
              {t.addressLine}, {t.city}
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted">
              <span>{t.technicianName ?? "Unassigned"}</span>
              <span>{formatClock(t.scheduledStart, tz)}</span>
            </div>
            <div className="mt-1 font-mono text-xs text-subtle">
              Codes {t.codes.map((c) => c.code).join("+") || "—"} · {formatHours(t.expectedHours)}h expected
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
