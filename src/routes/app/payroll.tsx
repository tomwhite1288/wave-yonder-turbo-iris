import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPayroll } from "@/lib/field/api-ops";
import { exportWeekPack } from "@/lib/field/api-account";
import { formatHours, formatMoney, downloadText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/payroll")({ component: PayrollPage });

function PayrollPage() {
  const q = useQuery({ queryKey: ["payroll"], queryFn: () => getPayroll() });
  const exportMut = useMutation({
    mutationFn: () => exportWeekPack(),
    onSuccess: (pack) => {
      downloadText(`payroll-${pack.from}.csv`, pack.csv.payroll, "text/csv");
      downloadText(`field-ledger-${pack.from}.json`, JSON.stringify(pack.json, null, 2), "application/json");
      toast.success("Payroll files downloaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { rows, from, to, profile } = q.data!;
  const total = rows.reduce((s, r) => s + r.totalWages, 0);
  const net = rows.reduce((s, r) => s + r.netPay, 0);
  const unpaid = rows.reduce((s, r) => s + r.unpaidHours, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
          <p className="text-sm text-muted">
            Week {from} – {to}. Wages only on GPS-backed in-transit, show, working, and office time. Estimate
            only — not a payroll processor. Tax: fed {profile.settings.payrollFedPct}% / DE{" "}
            {profile.settings.payrollStatePct}% / FICA {profile.settings.payrollFicaPct}%.
          </p>
        </div>
        <Button size="sm" variant="secondary" disabled={exportMut.isPending} onClick={() => exportMut.mutate()}>
          Export CSV + JSON
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Gross wages</div>
          <div className="font-mono text-2xl tabular">{formatMoney(total)}</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Est. net</div>
          <div className="font-mono text-2xl tabular">{formatMoney(net)}</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wide text-subtle">Unpaid clocked</div>
          <div className="font-mono text-2xl tabular">{formatHours(unpaid)}h</div>
        </Card>
      </div>
      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-subtle">
            <tr className="border-b border-border">
              {["Employee", "Paid", "Unpaid", "Drive", "Show", "Work", "Office", "OT", "Gross", "Tax", "Net"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.employee.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.employee.name}</div>
                  <div className="text-xs text-muted">{formatMoney(r.employee.hourlyWage)}/hr</div>
                </td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.paidHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.unpaidHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.travelHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.showHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.workHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.officeHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(r.overtimeHours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatMoney(r.totalWages)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatMoney(r.taxFed + r.taxState + r.taxFica)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatMoney(r.netPay)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
