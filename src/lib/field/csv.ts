import type { CodeBookKind, CodeImportRow } from "./types";

export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = src.split("\n").filter((l) => l.trim().length);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function inferBook(filename: string, row: Record<string, string>): CodeBookKind {
  const fromCol = (row.book || row.catalog || "").toLowerCase();
  if (fromCol.includes("hvac")) return "hvac";
  if (fromCol.includes("plumb")) return "plumbing";
  if (fromCol.includes("invoice") || fromCol.includes("labor") || fromCol.includes("pm")) return "invoice";
  const name = filename.toLowerCase();
  if (name.includes("hvac")) return "hvac";
  if (name.includes("plumb")) return "plumbing";
  if (name.includes("invoice")) return "invoice";
  const trade = (row.trade || "").toLowerCase();
  if (trade === "hvac") return "hvac";
  if (trade === "plumbing") return "plumbing";
  const cat = (row.category || "").toLowerCase();
  if (cat.includes("hvac")) return "hvac";
  if (cat.includes("plumb") || cat.includes("drain") || cat.includes("install")) return "plumbing";
  return "invoice";
}

export function rowToImport(row: Record<string, string>, filename: string): CodeImportRow | null {
  const code = (row.code || row.item || "").trim();
  if (!code) return null;
  const n = (v: string | undefined) => v ?? "";
  return {
    book: inferBook(filename, row),
    code,
    description: n(row.description || row.desc || row.name),
    category: n(row.category),
    trade: n(row.trade),
    hours: n(row.hours || row.typical_hrs || row.typicalhrs),
    parts_allowance: n(row.parts_allowance || row.partscost || row.parts_cost),
    list_price: n(row.list_price || row.listprice || row.labor_value || row.laborvalue),
    labor_value: n(row.labor_value || row.laborvalue || row.list_price),
    active: n(row.active || "true"),
    notes: n(row.notes),
  };
}

export function findMatchingCodes<T extends { code: string; description: string; hours: number; partsAllowance: number; book: string; category: string }>(
  items: T[],
  opts: { query?: string; hours?: number; parts?: number; book?: string },
) {
  const q = (opts.query ?? "").trim().toLowerCase();
  let pool = items;
  if (opts.book && opts.book !== "all") pool = pool.filter((c) => c.book === opts.book);
  if (q) {
    pool = pool.filter((c) => `${c.code} ${c.description} ${c.category}`.toLowerCase().includes(q));
  }
  const hours = opts.hours;
  const parts = opts.parts;
  const scored = pool.map((c) => {
    let score = 0;
    let tag: "match" | "range" | "search" = "search";
    if (hours != null && Number.isFinite(hours)) {
      const dh = Math.abs(c.hours - hours);
      if (dh < 0.001) {
        score += 50;
        tag = "match";
      } else if (dh <= 0.5) {
        score += 30 - dh * 10;
        tag = "range";
      } else if (dh <= 1) {
        score += 12 - dh * 4;
        tag = "range";
      }
    }
    if (parts != null && Number.isFinite(parts) && parts > 0) {
      if (c.partsAllowance >= parts && c.partsAllowance <= parts * 1.25) {
        score += 24;
        if (tag === "search") tag = "range";
      } else if (Math.abs(c.partsAllowance - parts) <= Math.max(25, parts * 0.2)) {
        score += 14;
        if (tag === "search") tag = "range";
      }
    }
    if (q && c.code.toLowerCase() === q) score += 40;
    if (q && c.description.toLowerCase().startsWith(q)) score += 10;
    return { item: c, score, tag };
  });
  return scored
    .filter((s) => (hours == null && parts == null && !q ? true : s.score > 0 || (q && s.tag === "search")))
    .sort((a, b) => b.score - a.score || a.item.hours - b.item.hours)
    .slice(0, 40);
}
