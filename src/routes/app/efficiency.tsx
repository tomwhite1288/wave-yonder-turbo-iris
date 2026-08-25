import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getEfficiency } from "@/lib/field/api-ops";
import { formatHours, formatMoney } from "@/lib/utils";

export const Route = createFileRoute("/app/efficiency")({ component: EfficiencyPage });

function EfficiencyPage() {
  const q = useQuery({ queryKey: ["efficiency"], queryFn: () => getEfficiency() });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { rows, from, to } = q.data!;
  const chart = rows.map((r) => ({
    name: r.employee.firstName,
    efficiency: Math.round(r.billableEfficiency * 100),
    utilization: Math.round(r.fieldUtilization * 100),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billable efficiency</h1>
        <p className="text-sm text-muted">
          Week {from} – {to}. Efficiency = billable ÷ available hours. Formulas are configurable in Settings.
        </p>
      </div>
      <div className="h-56 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <XAxis dataKey="name" stroke="#8a939c" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#8a939c" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#1b2229", border: "1px solid rgb(238 241 244 / 0.1)", borderRadius: 8 }}
            />
            <Bar dataKey="efficiency" fill="#6b9aa8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-subtle">
            <tr className="border-b border-border">
              {["Technician", "Eff.", "Util.", "Billable", "Field", "Rev / billable", "Contribution"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows
              .slice()
              .sort((a, b) => b.billableEfficiency - a.billableEfficiency)
              .map((r) => (
                <tr key={r.employee.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-medium">{r.employee.name}</td>
                  <td className="px-4 py-3 font-mono tabular">{Math.round(r.billableEfficiency * 100)}%</td>
                  <td className="px-4 py-3 font-mono tabular">{Math.round(r.fieldUtilization * 100)}%</td>
                  <td className="px-4 py-3 font-mono tabular">{formatHours(r.billableHours)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatHours(r.fieldHours)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatMoney(r.revenuePerBillableHour)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatMoney(r.grossContribution)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
