import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getJob } from "@/lib/field/api";
import { ExceptionTone } from "@/lib/field/status";
import { formatClock, formatHours, formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/jobs/$ticketId")({ component: JobDetail });

function JobDetail() {
  const { ticketId } = Route.useParams();
  const q = useQuery({ queryKey: ["job", ticketId], queryFn: () => getJob({ data: ticketId }) });
  if (q.isLoading) return <div className="h-80 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { ticket, entries, parts, exceptions, profile } = q.data!;
  const tz = profile.settings.timezone;
  const billed = entries
    .filter((e) => e.kind === "work")
    .reduce((s, e) => s + (e.clockOut ? e.billableMinutes : (Date.now() - new Date(e.clockIn).getTime()) / 60000), 0) / 60;
  const delta = billed - ticket.expectedHours;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/app/jobs" className="text-sm text-muted hover:text-fg">
        ← Jobs
      </Link>
      <div>
        <div className="font-mono text-primary">#{ticket.ticketNumber}</div>
        <h1 className="text-2xl font-semibold tracking-tight">{ticket.customerName}</h1>
        <p className="text-sm text-muted">
          {ticket.addressLine}, {ticket.city}, {ticket.state} {ticket.zip}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Expected</div>
          <div className="font-mono text-xl tabular">{formatHours(ticket.expectedHours)}h</div>
          <div className="text-xs text-muted">{ticket.codes.map((c) => `${c.code} ${c.hoursExpected}`).join(" + ")}</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Actual billable</div>
          <div className="font-mono text-xl tabular">{formatHours(billed)}h</div>
          <div className="text-xs text-muted">
            {delta > 0.1 ? "Under-coded vs time" : delta < -0.1 ? "Codes exceed time" : "Within tolerance"}
          </div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Invoice</div>
          <div className="font-mono text-xl tabular">{formatMoney(ticket.invoiceAmount)}</div>
          <div className="text-xs text-muted">{ticket.invoiceNumber ?? "Not imported"}</div>
        </Card>
      </div>
      <Card>
        <h2 className="mb-3 text-sm font-semibold">Time on this ticket</h2>
        <ul className="space-y-2 text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex justify-between gap-3">
              <span className="capitalize text-muted">{e.kind}</span>
              <span className="font-mono tabular">
                {formatClock(e.clockIn, tz)} – {e.clockOut ? formatClock(e.clockOut, tz) : "open"}
              </span>
            </li>
          ))}
          {entries.length === 0 ? <li className="text-muted">No punches yet.</li> : null}
        </ul>
      </Card>
      <Card>
        <h2 className="mb-3 text-sm font-semibold">Parts</h2>
        <ul className="space-y-2 text-sm">
          {parts.map((p) => (
            <li key={p.id} className="flex justify-between gap-3">
              <span>
                {p.manufacturer} {p.part_number} · {p.description}
              </span>
              <span className="font-mono">
                ×{p.quantity} {formatMoney(p.unit_price)}
              </span>
            </li>
          ))}
          {parts.length === 0 ? <li className="text-muted">No parts posted.</li> : null}
        </ul>
      </Card>
      <Card>
        <h2 className="mb-3 text-sm font-semibold">Exceptions</h2>
        <ul className="space-y-2">
          {exceptions.map((x) => (
            <li key={x.id} className="flex items-start gap-2 text-sm">
              <ExceptionTone kind={x.kind} />
              <span className="text-muted">{x.message}</span>
            </li>
          ))}
          {exceptions.length === 0 ? <li className="text-sm text-muted">None.</li> : null}
        </ul>
      </Card>
    </div>
  );
}
