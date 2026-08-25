import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { approveTimecard, listTimecards } from "@/lib/field/api-ops";
import { formatClock, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { minutesBetween } from "@/lib/field/calc";

export const Route = createFileRoute("/app/timecards")({ component: TimecardsPage });

function TimecardsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["timecards"], queryFn: () => listTimecards() });
  const approve = useMutation({
    mutationFn: approveTimecard,
    onSuccess: () => {
      toast.success("Timecard approved");
      void qc.invalidateQueries({ queryKey: ["timecards"] });
    },
  });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { entries, cards, people, profile, from, to } = q.data!;
  const tz = profile.settings.timezone;
  const canApprove = profile.employee.role !== "technician";

  const byEmp = people
    .filter((p) => p.role === "technician" || entries.some((e) => e.employeeId === p.id))
    .map((p) => ({
      person: p,
      entries: entries.filter((e) => e.employeeId === p.id),
      card: cards.find((c) => c.employee_id === p.id),
    }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Timecards</h1>
        <p className="text-sm text-muted">
          Week of {from} – {to}. Originals are preserved when hours are edited.
        </p>
      </div>
      <div className="space-y-4">
        {byEmp.map(({ person, entries: mine, card }) => (
          <section key={person.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{person.name}</div>
                <div className="text-xs text-muted">{person.employeeNumber}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={card?.status === "approved" ? "ok" : "warn"}>{card?.status ?? "open"}</Badge>
                {canApprove ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      approve.mutate({
                        data: { employeeId: person.id, workDate: from, note: "Approved from Field Ledger" },
                      })
                    }
                  >
                    Approve week
                  </Button>
                ) : null}
              </div>
            </div>
            <ul className="space-y-1 text-sm">
              {mine.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-1.5">
                  <span className="capitalize text-muted">{e.kind}</span>
                  <span className="font-mono text-xs">#{e.ticketNumber ?? "—"}</span>
                  <span className="font-mono tabular">
                    {formatClock(e.clockIn, tz)}–{e.clockOut ? formatClock(e.clockOut, tz) : "open"}
                  </span>
                  <span className="font-mono tabular">{formatDuration(minutesBetween(e.clockIn, e.clockOut))}</span>
                  {e.adjusted ? <Badge tone="info">adjusted</Badge> : null}
                </li>
              ))}
              {mine.length === 0 ? <li className="text-muted">No punches this week.</li> : null}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
