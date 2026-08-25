import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPayroll } from "@/lib/field/api-ops";
import { formatHours, formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/payroll")({ component: PayrollPage });

function PayrollPage() {
  const q = useQuery({ queryKey: ["payroll"], queryFn: () => getPayroll() });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { rows, from, to } = q.data!;
  const total = rows.reduce((s, r) => s + r.totalWages, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payroll estimate</h1>
        <p className="text-sm text-muted">
          Week {from} – {to}. Historical wage rates are retained. This is not a payroll processor.
        </p>
      </div>
      <Card>
        <div className="text-[11px] uppercase tracking-wide text-subtle">Estimated gross</div>
        <div className="font-mono text-3xl tabular">{formatMoney(total)}</div>
      </Card>
      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="min-w-[800px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-subtle">
            <tr className="border-b border-border">
              {["Employee", "Reg", "OT", "Wages", "Billable", "Revenue", "Labor %", "Contribution"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.employee.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.employee.name}</div>
                  <div className="text-xs text-muted">{formatMoney(r.employee.hourlyWage)}/hr</div>
                </td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.regularHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.overtimeHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatMoney(r.totalWages)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.billableHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatMoney(r.totalRevenue)}</td>
                <td className="px-4 py-3 font-mono tabular">{Math.round(r.laborCostPct * 100)}%</td>
                <td className="px-4 py-3 font-mono tabular">{formatMoney(r.contributionAfterLabor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
