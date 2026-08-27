import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { listExceptions, resolveException } from "@/lib/field/api-ops";
import { ExceptionTone } from "@/lib/field/status";
import { formatClock } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ExceptionKind } from "@/lib/field/types";

export const Route = createFileRoute("/app/exceptions")({ ssr: false, component: ExceptionsPage });

const FILTERS: { id: "open" | "all" | ExceptionKind; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "all", label: "All" },
  { id: "missing_time", label: "No punches" },
  { id: "unpaid_claim", label: "Unpaid claim" },
  { id: "under_billed", label: "Under-coded" },
  { id: "over_billed", label: "Over-coded" },
  { id: "missing_code", label: "No code" },
  { id: "office_mismatch", label: "Office GPS" },
  { id: "travel_mismatch", label: "Travel GPS" },
  { id: "parts_over_allowance", label: "Parts" },
];

function ExceptionsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("open");
  const q = useQuery({ queryKey: ["exceptions"], queryFn: () => listExceptions(), refetchInterval: 30_000 });
  const mut = useMutation({
    mutationFn: resolveException,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exceptions"] }),
  });
  const items = q.data?.items ?? [];
  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "open") return items.filter((x) => x.status === "open");
    return items.filter((x) => x.kind === filter);
  }, [items, filter]);
  const openCount = items.filter((x) => x.status === "open").length;

  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { profile, from, to } = q.data!;
  const can = profile.employee.role !== "technician";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hours billed to the office</h1>
          <p className="text-sm text-muted">
            Week {from} – {to}. Flags fire when GPS, punches, invoice codes, or parts receipts do not match
            payable time (in transit, show, working, office).
          </p>
        </div>
        <Badge tone={openCount ? "warn" : "ok"}>{openCount} open</Badge>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`h-9 shrink-0 rounded-md px-3 text-xs font-medium ${
              filter === f.id ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="flex items-start gap-3 rounded-2xl p-6">
          <ShieldAlert className="mt-0.5 size-5 text-ok" />
          <div>
            <p className="font-medium">No mismatches in this view</p>
            <p className="mt-1 text-sm text-muted">
              Assigned jobs with no GPS-backed punches, travel claimed at the shop, office time away from{" "}
              {profile.settings.officeAddress}, codes that do not cover on-site hours, and receipt prices over
              the code parts range all land here automatically.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="space-y-2">
          {visible.map((x) => (
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
      )}
    </div>
  );
}
