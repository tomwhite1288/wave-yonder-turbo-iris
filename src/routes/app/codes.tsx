import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listCodes, upsertCode } from "@/lib/field/api-ops";
import { formatHours, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/codes")({ component: CodesPage });

function CodesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["codes"], queryFn: () => listCodes() });
  const [code, setCode] = useState("");
  const [hours, setHours] = useState("1");
  const [description, setDescription] = useState("");
  const mut = useMutation({
    mutationFn: upsertCode,
    onSuccess: () => {
      toast.success("Code saved");
      setCode("");
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { items, profile } = q.data!;
  const isAdmin = profile.employee.role === "admin";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Code book</h1>
        <p className="text-sm text-muted">Expected hours per invoice code. Values are not hard-coded.</p>
      </div>
      {isAdmin ? (
        <Card className="grid gap-2 sm:grid-cols-[1fr_1fr_80px_auto]">
          <Input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="Hours" value={hours} onChange={(e) => setHours(e.target.value)} />
          <Button
            onClick={() =>
              mut.mutate({
                data: {
                  code,
                  description: description || code,
                  category: "Labor",
                  trade: "both",
                  hours: Number(hours) || 1,
                  laborValue: (Number(hours) || 1) * profile.settings.laborRate,
                  active: true,
                },
              })
            }
          >
            Add
          </Button>
        </Card>
      ) : null}
      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-subtle">
            <tr className="border-b border-border">
              {["Code", "Description", "Trade", "Hours", "Labor"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3 font-mono">{c.code}</td>
                <td className="px-4 py-3">{c.description}</td>
                <td className="px-4 py-3 capitalize text-muted">{c.trade}</td>
                <td className="px-4 py-3 font-mono tabular">{formatHours(c.hours)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatMoney(c.laborValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
