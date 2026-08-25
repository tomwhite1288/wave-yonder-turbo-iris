import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listExceptions, resolveException } from "@/lib/field/api-ops";
import { ExceptionTone } from "@/lib/field/status";
import { formatClock } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/exceptions")({ component: ExceptionsPage });

function ExceptionsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["exceptions"], queryFn: () => listExceptions() });
  const mut = useMutation({
    mutationFn: resolveException,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exceptions"] }),
  });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { items, profile } = q.data!;
  const can = profile.employee.role !== "technician";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exceptions</h1>
        <p className="text-sm text-muted">GPS and invoice mismatches never silently change pay.</p>
      </div>
      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="flex flex-wrap items-center gap-2">
              <ExceptionTone kind={x.kind} />
              <Badge tone={x.status === "open" ? "warn" : "neutral"}>{x.status}</Badge>
              <span className="text-sm font-medium">{x.employeeName}</span>
              {x.ticketId ? (
                <Link to="/app/jobs/$ticketId" params={{ ticketId: x.ticketId }} className="font-mono text-xs text-primary">
                  #{x.ticketNumber}
                </Link>
              ) : null}
              <span className="ml-auto text-xs text-subtle">{formatClock(x.createdAt, profile.settings.timezone)}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{x.message}</p>
            {can && x.status === "open" ? (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => mut.mutate({ data: { id: x.id, status: "acknowledged" } })}>
                  Acknowledge
                </Button>
                <Button size="sm" variant="ghost" onClick={() => mut.mutate({ data: { id: x.id, status: "resolved" } })}>
                  Resolve
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
