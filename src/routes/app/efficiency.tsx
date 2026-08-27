import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getEfficiency } from "@/lib/field/api-ops";
import { formatHours, formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/spinner";

export const Route = createFileRoute("/app/efficiency")({ ssr: false, component: EfficiencyPage });

function EfficiencyPage() {
  const q = useQuery({ queryKey: ["efficiency"], queryFn: () => getEfficiency(), refetchInterval: 30_000 });
  if (q.isLoading) return <Spinner label="Calculating sold vs available hours…" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { rows, from, to, profile } = q.data!;
  const chart = rows.map((r) => ({
    name: r.employee.firstName,
    sold: Math.round(r.billableEfficiency * 100),
    job: Math.round(r.jobEfficiency * 100),
    util: Math.round(r.fieldUtilization * 100),
  }));
  const source = profile.settings.efficiencyAvailableSource === "clock" ? "clocked hours" : "scheduled 42.5h week";
  const companyPct = Math.round(
    (rows.reduce((s, r) => s + r.soldHours, 0) /
      Math.max(rows.reduce((s, r) => s + r.availableHours, 0), 0.001)) *
      100,
  );
  const target = profile.settings.efficiencyAlertPct || 80;
  const below = rows.filter((r) => r.availableHours >= 1 && r.billableEfficiency * 100 < target);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billable efficiency</h1>
        <p className="text-sm text-muted">
          Week {from} – {to}. Sold (code) hours ÷ available hours — not hourly wage. Finishing a 3-hour job in 2
          still counts 3 sold hours. Alert fires below {target}%.
        </p>
      </div>
      {companyPct < target ? (
        <Card className="border border-warn/40 bg-warn/10">
          <p className="text-sm font-medium">Company efficiency is {companyPct}% — below the {target}% target.</p>
          {below.length ? (
            <p className="mt-1 text-xs text-muted">
              {below.map((r) => `${r.employee.name} ${Math.round(r.billableEfficiency * 100)}%`).join(" · ")}
            </p>
          ) : null}
        </Card>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Company sold ÷ available</div>
          <div className="font-mono text-2xl tabular">{companyPct}%</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Sold hours</div>
          <div className="font-mono text-2xl tabular">
            {formatHours(rows.reduce((s, r) => s + r.soldHours, 0))}
          </div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Available ({source})</div>
          <div className="font-mono text-2xl tabular">
            {formatHours(rows.reduce((s, r) => s + r.availableHours, 0))}
          </div>
        </Card>
      </div>
      <div className="h-56 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <XAxis dataKey="name" stroke="currentColor" className="text-subtle" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="currentColor" className="text-subtle" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                color: "var(--color-fg)",
              }}
            />
            <Bar dataKey="sold" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-subtle">
            <tr className="border-b border-border">
              {["Technician", "ST eff.", "Job eff.", "Util.", "Sold", "On site", "Drive", "Office", "Paid", "Rev / sold"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows
              .slice()
              .sort((a, b) => b.billableEfficiency - a.billableEfficiency)
              .map((r) => (
                <tr key={r.employee.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-medium">{r.employee.name}</td>
                  <td className={`px-4 py-3 font-mono tabular ${r.billableEfficiency * 100 < target ? "text-warn" : ""}`}>
                    {Math.round(r.billableEfficiency * 100)}%
                  </td>
                  <td className="px-4 py-3 font-mono tabular">{Math.round(r.jobEfficiency * 100)}%</td>
                  <td className="px-4 py-3 font-mono tabular">{Math.round(r.fieldUtilization * 100)}%</td>
                  <td className="px-4 py-3 font-mono tabular">{formatHours(r.soldHours)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatHours(r.jobHours)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatHours(r.driveHours)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatHours(r.officeHours)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatHours(r.paidHours)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatMoney(r.revenuePerBillableHour)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
