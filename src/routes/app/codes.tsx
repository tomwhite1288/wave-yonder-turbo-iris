import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { importCodes, listCodes, upsertCode } from "@/lib/field/api-ops";
import { findMatchingCodes, parseCsv, rowToImport } from "@/lib/field/csv";
import { formatHours, formatMoney } from "@/lib/utils";
import type { CodeBookKind } from "@/lib/field/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/app/codes")({ component: CodesPage });

const BOOKS: { id: CodeBookKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "invoice", label: "Invoice" },
  { id: "plumbing", label: "Plumbing" },
  { id: "hvac", label: "HVAC" },
];

function CodesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["codes"], queryFn: () => listCodes() });
  const [book, setBook] = useState<CodeBookKind | "all">("all");
  const [query, setQuery] = useState("");
  const [hours, setHours] = useState("");
  const [parts, setParts] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [newHours, setNewHours] = useState("1");
  const [newBook, setNewBook] = useState<CodeBookKind>("invoice");

  const add = useMutation({
    mutationFn: upsertCode,
    onSuccess: () => {
      toast.success("Code saved");
      setCode("");
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const imp = useMutation({
    mutationFn: importCodes,
    onSuccess: (res) => {
      toast.success(`Imported ${res.upserted} codes`);
      void qc.invalidateQueries({ queryKey: ["codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = q.data?.items ?? [];
  const isAdmin = q.data?.profile.employee.role === "admin";

  const filtered = useMemo(() => {
    const hrs = hours.trim() ? Number(hours) : undefined;
    const pts = parts.trim() ? Number(parts) : undefined;
    if (!query && hrs == null && pts == null) {
      return items
        .filter((c) => (book === "all" ? true : c.book === book))
        .map((item) => ({ item, tag: "search" as const, score: 0 }));
    }
    return findMatchingCodes(items, { query, hours: hrs, parts: pts, book });
  }, [items, book, query, hours, parts]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const rows = [];
    for (const file of Array.from(files)) {
      const text = await file.text();
      const parsed = parseCsv(text);
      for (const row of parsed) {
        const rec = rowToImport(row, file.name);
        if (rec) rows.push(rec);
      }
    }
    if (!rows.length) {
      toast.error("No code rows found in those files");
      return;
    }
    imp.mutate({ data: { rows } });
  }

  if (q.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Code book</h1>
        <p className="text-sm text-muted">Invoice codes stay separate from plumbing and HVAC job codes. Import CSV yourself for beta — nothing is auto-loaded.</p>
      </div>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Lookup</h2>
        <p className="text-xs text-muted">Search by description, or enter hours + parts allowance to find matching and in-range codes.</p>
        <div className="grid gap-2 sm:grid-cols-4">
          <Input placeholder="Description or code" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Input placeholder="Hours" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
          <Input placeholder="Parts allowance $" inputMode="decimal" value={parts} onChange={(e) => setParts(e.target.value)} />
          <Button variant="secondary" onClick={() => { setQuery(""); setHours(""); setParts(""); }}>Clear</Button>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {BOOKS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBook(b.id)}
            className={`h-9 rounded-md px-3 text-xs font-medium ${book === b.id ? "bg-primary text-primary-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"}`}
          >
            {b.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted">{filtered.length} shown · {items.length} in book</span>
      </div>

      {isAdmin ? (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Add / import</h2>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_80px_120px_auto]">
            <Input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input placeholder="Hours" value={newHours} onChange={(e) => setNewHours(e.target.value)} />
            <select className="h-11 rounded-md border border-border bg-elevated px-3 text-sm" value={newBook} onChange={(e) => setNewBook(e.target.value as CodeBookKind)}>
              <option value="invoice">Invoice</option>
              <option value="plumbing">Plumbing</option>
              <option value="hvac">HVAC</option>
            </select>
            <Button
              onClick={() =>
                add.mutate({
                  data: {
                    code,
                    description: description || code,
                    category: newBook === "invoice" ? "Price/Labor & Material" : newBook,
                    trade: newBook === "invoice" ? "both" : newBook,
                    book: newBook,
                    hours: Number(newHours) || 1,
                    laborValue: (Number(newHours) || 1) * (q.data?.profile.settings.laborRate ?? 185),
                    active: true,
                  },
                })
              }
            >
              Add
            </Button>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-subtle">CSV import (one or many files)</span>
            <input
              type="file"
              accept=".csv,text/csv"
              multiple
              className="block w-full text-sm text-muted file:mr-3 file:h-10 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:text-fg"
              onChange={(e) => void onFiles(e.target.files)}
            />
            <span className="mt-1 block text-xs text-muted">
              Columns: book, code, description, category, trade, hours, parts_allowance, list_price, labor_value, active, notes
            </span>
            <p className="mt-2 text-xs text-muted">
              Sample packs (not loaded):{" "}
              <a className="text-primary underline-offset-2 hover:underline" href="/samples/codes-all.csv" download>
                all books
              </a>
              {" · "}
              <a className="text-primary underline-offset-2 hover:underline" href="/samples/codes-invoice.csv" download>
                invoice
              </a>
              {" · "}
              <a className="text-primary underline-offset-2 hover:underline" href="/samples/codes-plumbing.csv" download>
                plumbing
              </a>
              {" · "}
              <a className="text-primary underline-offset-2 hover:underline" href="/samples/codes-hvac.csv" download>
                HVAC
              </a>
            </p>
          </label>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Code book is empty on purpose. Import the beta CSV when you are ready.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-subtle">
              <tr className="border-b border-border">
                {["Code", "Description", "Book", "Hours", "Parts $", "Labor", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ item, tag }) => (
                <tr key={item.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-mono">{item.code}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 capitalize text-muted">{item.book}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatHours(item.hours)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatMoney(item.partsAllowance)}</td>
                  <td className="px-4 py-3 font-mono tabular">{formatMoney(item.laborValue)}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wide text-subtle">
                    {tag === "match" ? "Match" : tag === "range" ? "In range" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
