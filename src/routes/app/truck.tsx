import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTruck, replenishTruck, useTruckPart } from "@/lib/field/api-parts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/truck")({ component: TruckPage });

function TruckPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["truck"], queryFn: () => getTruck({ data: {} }) });
  const usePart = useMutation({
    mutationFn: useTruckPart,
    onSuccess: () => {
      toast.success("Part deducted from truck");
      void qc.invalidateQueries({ queryKey: ["truck"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const fill = useMutation({
    mutationFn: replenishTruck,
    onSuccess: () => {
      toast.success("Replenished");
      void qc.invalidateQueries({ queryKey: ["truck"] });
    },
  });
  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;
  const { items, profile } = q.data!;
  const canFill = profile.employee.role !== "technician";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Truck stock</h1>
        <p className="text-sm text-muted">Using a part on a ticket reduces van quantity.</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-sm">{item.part.partNumber}</div>
              <div className="truncate text-sm text-muted">
                {item.part.manufacturer} · {item.part.description}
              </div>
            </div>
            {item.needsReplenish ? <Badge tone="warn">below min</Badge> : <Badge tone="ok">stocked</Badge>}
            <div className="font-mono tabular">
              {item.quantity} / min {item.minQuantity}
            </div>
            <Button size="sm" variant="secondary" onClick={() => usePart.mutate({ data: { inventoryId: item.id, qty: 1 } })}>
              Use 1
            </Button>
            {canFill ? (
              <Button size="sm" variant="ghost" onClick={() => fill.mutate({ data: { inventoryId: item.id, qty: 2 } })}>
                +2
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
