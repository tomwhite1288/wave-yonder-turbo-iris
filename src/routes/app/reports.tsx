import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getReports } from "@/lib/field/api-ops";
import { formatHours, formatMoney, num } from "@/lib/utils";

export const Route = createFileRoute("/app/reports")({ component: ReportsPage });

function ReportsPage() {
  const q = useQuery({ queryKey: ["reports"], queryFn: () => getReports() });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { byEmp, tickets, from, to } = q.data!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted">Week {from} – {to}</p>
      </div>
      <section>
        <h2 className="mb-2 text-sm font-semibold">Technician ranking</h2>
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="min-w-[560px] w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-subtle">
              <tr className="border-b border-border">
                {["Technician", "Worked", "Billable", "Non-billable"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byEmp
                .slice()
                .sort((a, b) => b.hours.billable - a.hours.billable)
                .map((r) => (
                  <tr key={r.employee.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3">{r.employee.name}</td>
                    <td className="px-4 py-3 font-mono tabular">{formatHours(r.hours.worked / 60)}</td>
                    <td className="px-4 py-3 font-mono tabular">{formatHours(r.hours.billable / 60)}</td>
                    <td className="px-4 py-3 font-mono tabular">{formatHours(r.hours.nonBillable / 60)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold">Tickets</h2>
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="min-w-[640px] w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-subtle">
              <tr className="border-b border-border">
                {["Ticket", "Customer", "Labor", "Parts", "Invoice"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.ticket_number} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-mono">#{t.ticket_number}</td>
                  <td className="px-4 py-3">{t.customer_name}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatMoney(num(t.labor_amount))}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatMoney(num(t.parts_amount))}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatMoney(num(t.invoice_amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
