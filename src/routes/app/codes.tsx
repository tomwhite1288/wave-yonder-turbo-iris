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
import { Spinner } from "@/components/spinner";

export const Route = createFileRoute("/app/codes")({ component: CodesPage });

const BOOKS: { id: CodeBookKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "invoice", label: "Invoice" },
  { id: "plumbing", label: "Plumbing" },
  { id: "hvac", label: "HVAC" },
];

function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-primary/20 text-fg">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

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
    const CHUNK = 400;
    const toastId = toast.loading(`Importing ${rows.length} codes…`);
    try {
      let upserted = 0;
      let skipped = 0;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const res = await importCodes({ data: { rows: slice } });
        upserted += res.upserted;
        skipped += res.skipped;
        toast.loading(`Imported ${upserted} of ${rows.length}…`, { id: toastId });
      }
      toast.success(`Imported ${upserted} codes${skipped ? ` (${skipped} skipped)` : ""}`, { id: toastId });
      void qc.invalidateQueries({ queryKey: ["codes"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed", { id: toastId });
    }
  }

  if (q.isLoading) return <Spinner label="Loading code book…" />;
  if (q.error) return <p className="text-sm text-danger">{q.error.message}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Code book</h1>
        <p className="text-sm text-muted">
          Type a description — t, then o-i-l-e-t — and matching codes appear as you type, with estimated hours and
          parts allowance. Plumbing carries both. HVAC hours are estimated from list price at the shop labor rate;
          edit a row if your typical time differs.
        </p>
      </div>
      <Card className="space-y-3 rounded-2xl p-5">
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing a description…"
          className="h-12 text-base"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BOOKS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBook(b.id)}
              className={`h-11 rounded-md text-sm ${book === b.id ? "bg-primary text-primary-fg" : "bg-elevated text-muted"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Est. hours" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
          <Input placeholder="Parts $ allowance" inputMode="decimal" value={parts} onChange={(e) => setParts(e.target.value)} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{filtered.length} shown · {items.length} in book</span>
          <button type="button" className="text-primary" onClick={() => { setQuery(""); setHours(""); setParts(""); }}>
            Clear
          </button>
        </div>
      </Card>

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
            <div className="mt-3 space-y-1.5 text-xs text-muted">
              <p className="font-medium text-fg">Phone copy — one HTML file on this site</p>
              <p>
                <a className="text-primary underline-offset-2 hover:underline" href="/Maichles-Code-Book.html">
                  Maichle's Code Book
                </a>
                <span>
                  {" "}
                  · the whole truck app, hosted here. Open it on the phone and add to the home screen, or save that
                  single file. No zip, no Python, no extra CSS — iPhone and Android will not host a folder of scripts.
                </span>
              </p>
              <p className="font-medium text-fg">Office import — download, then import here. Not loaded until you do.</p>
              <p>
                <a className="text-primary underline-offset-2 hover:underline" href="/samples/codes-hvac.csv" download>
                  HVAC
                </a>
                <span> · 3,159 codes from Service.csv</span>
              </p>
              <p>
                <a className="text-primary underline-offset-2 hover:underline" href="/samples/codes-plumbing.csv" download>
                  Plumbing
                </a>
                <span> · 1,172 codes from Plumbing.xlsx</span>
              </p>
              <p>
                <a className="text-primary underline-offset-2 hover:underline" href="/samples/codes-invoice.csv" download>
                  Invoice
                </a>
                <span> · 47 office / labor codes</span>
              </p>
              <p>
                <a className="text-primary underline-offset-2 hover:underline" href="/samples/codes-all.csv" download>
                  All books
                </a>
                <span> · 4,378 rows, one file</span>
              </p>
            </div>
          </label>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Code book is empty on purpose. Download HVAC, plumbing, or all books above and import when you are ready.</p>
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
                  <td className="px-4 py-3 font-mono">{highlight(item.code, query)}</td>
                  <td className="px-4 py-3">{highlight(item.description, query)}</td>
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
