import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSchedules } from "@/lib/field/api-ops";

export const Route = createFileRoute("/app/schedules")({ component: SchedulesPage });

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function hm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const am = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${m.toString().padStart(2, "0")} ${am}`;
}

function SchedulesPage() {
  const q = useQuery({ queryKey: ["schedules"], queryFn: () => getSchedules() });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { people, rows } = q.data!;
  const techs = people.filter((p) => p.role === "technician" || rows.some((r) => r.employee_id === p.id));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schedules</h1>
        <p className="text-sm text-muted">Compared against actual punches on the timecard.</p>
      </div>
      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-subtle">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Technician</th>
              {DAYS.map((d) => (
                <th key={d} className="px-3 py-3 font-medium">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {techs.map((p) => (
              <tr key={p.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                {DAYS.map((_, day) => {
                  const slot = rows.find((r) => r.employee_id === p.id && r.day_of_week === day);
                  return (
                    <td key={day} className="px-3 py-3 font-mono text-xs text-muted">
                      {slot ? `${hm(slot.start_minutes)}–${hm(slot.end_minutes)}` : "Off"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
