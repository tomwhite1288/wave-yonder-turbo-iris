import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAudit } from "@/lib/field/api-ops";
import { formatClock } from "@/lib/utils";

export const Route = createFileRoute("/app/audit")({ ssr: false, component: AuditPage });

function AuditPage() {
  const q = useQuery({ queryKey: ["audit"], queryFn: () => listAudit() });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { items, profile } = q.data!;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit trail</h1>
        <p className="text-sm text-muted">Original values, new values, actor, and reason.</p>
      </div>
      <ol className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="font-medium">{item.actorName ?? "System"}</span>
              <span className="text-muted">{item.action.replaceAll("_", " ")}</span>
              <span className="ml-auto font-mono text-xs text-subtle">
                {formatClock(item.createdAt, profile.settings.timezone)}
              </span>
            </div>
            {item.reason ? <p className="mt-1 text-sm text-muted">{item.reason}</p> : null}
            {item.originalValue ? (
              <pre className="mt-2 overflow-x-auto font-mono text-[11px] text-subtle">{item.originalValue}</pre>
            ) : null}
            {item.newValue ? (
              <pre className="mt-1 overflow-x-auto font-mono text-[11px] text-muted">{item.newValue}</pre>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
