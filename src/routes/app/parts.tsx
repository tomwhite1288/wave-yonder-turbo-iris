import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchParts } from "@/lib/field/api-parts";
import { formatMoney } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/parts")({ ssr: false, component: PartsPage });

function PartsPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState({ q: "", category: "" });
  const query = useQuery({
    queryKey: ["parts", search],
    queryFn: () => searchParts({ data: search }),
  });
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Parts intelligence</h1>
        <p className="text-sm text-muted">Plumbing and HVAC catalog. Search number, manufacturer, alias, or category.</p>
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch({ q, category });
        }}
      >
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="1225, capacitor, flapper…" />
        <div className="flex gap-2">
          <Button type="button" variant={category === "" ? "default" : "secondary"} onClick={() => setCategory("")}>
            All
          </Button>
          <Button type="button" variant={category === "plumbing" ? "default" : "secondary"} onClick={() => setCategory("plumbing")}>
            Plumbing
          </Button>
          <Button type="button" variant={category === "hvac" ? "default" : "secondary"} onClick={() => setCategory("hvac")}>
            HVAC
          </Button>
          <Button type="submit">Search</Button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-subtle">
            <tr className="border-b border-border">
              {["Part", "Description", "Category", "Cost", "Sell", "Truck / WH"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-mono">{p.partNumber}</div>
                  <div className="text-xs text-muted">{p.manufacturer}</div>
                </td>
                <td className="px-4 py-3">{p.description}</td>
                <td className="px-4 py-3">
                  <Badge tone="info">{p.category}</Badge>
                  <div className="text-xs text-muted">{p.subcategory}</div>
                </td>
                <td className="px-4 py-3 font-mono tabular">{formatMoney(p.cost)}</td>
                <td className="px-4 py-3 font-mono tabular">{formatMoney(p.sellPrice)}</td>
                <td className="px-4 py-3 font-mono tabular">
                  {p.stockQty} / {p.warehouseQty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
