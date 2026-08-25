import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listPeople } from "@/lib/field/api";
import { setEmployeeRole } from "@/lib/field/api-admin";
import { formatMoney } from "@/lib/utils";
import type { Role } from "@/lib/field/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/people")({ component: PeoplePage });

function PeoplePage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["people"], queryFn: () => listPeople() });
  const roleMut = useMutation({
    mutationFn: setEmployeeRole,
    onSuccess: () => {
      toast.success("Role updated");
      void qc.invalidateQueries({ queryKey: ["people"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { people, profile } = q.data!;
  const isAdmin = profile.employee.role === "admin";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="text-sm text-muted">Wage history is stored by effective date. Current rate shown.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {people.map((p) => (
          <article key={p.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted">{p.employeeNumber} · {p.email}</div>
              </div>
              <Badge tone={p.role === "admin" ? "info" : p.role === "manager" ? "warn" : "ok"}>{p.role}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-subtle">Department</div>
                {p.department}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-subtle">Wage</div>
                <span className="font-mono">{formatMoney(p.hourlyWage)}/hr</span>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-subtle">Vehicle</div>
                {p.vehicle ?? "—"}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-subtle">Linked login</div>
                {p.userId ? "Yes" : "Pending"}
              </div>
            </div>
            {isAdmin ? (
              <label className="mt-3 block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">Role</span>
                <select
                  className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg"
                  value={p.role}
                  disabled={roleMut.isPending}
                  onChange={(e) =>
                    roleMut.mutate({ data: { employeeId: p.id, role: e.target.value as Role } })
                  }
                >
                  <option value="admin">Administrator</option>
                  <option value="manager">Manager</option>
                  <option value="technician">Technician</option>
                </select>
              </label>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
