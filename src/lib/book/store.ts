import { num } from "@/lib/utils";
import { parseCsv, rowToImport } from "@/lib/field/csv";
import type { CodeBookKind } from "@/lib/field/types";

export type BookCode = {
  id: string;
  code: string;
  description: string;
  category: string;
  trade: string;
  book: CodeBookKind;
  hours: number;
  partsAllowance: number;
  laborValue: number;
  notes: string | null;
};

export type BookSettings = {
  book: CodeBookKind | "all";
  hourWindow: number;
  partsPct: number;
  theme: "stock" | "field" | "light";
};

export const DEFAULT_BOOK_SETTINGS: BookSettings = {
  book: "plumbing",
  hourWindow: 1,
  partsPct: 0.25,
  theme: "stock",
};

const DB_NAME = "maichles-codebook";
const DB_VER = 1;
const SETTINGS_KEY = "fl-codebook-settings";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("codes")) {
        const store = db.createObjectStore("codes", { keyPath: "id" });
        store.createIndex("book", "book", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB unavailable"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB aborted"));
  });
}

export async function listBookCodes(): Promise<BookCode[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction("codes", "readonly").objectStore("codes").getAll();
    req.onsuccess = () => resolve((req.result as BookCode[]) ?? []);
    req.onerror = () => reject(req.error ?? new Error("Could not read codes"));
  });
}

export async function upsertBookCodes(items: BookCode[]): Promise<number> {
  if (!items.length) return 0;
  const db = await openDb();
  const tx = db.transaction("codes", "readwrite");
  const store = tx.objectStore("codes");
  for (const item of items) store.put(item);
  await txDone(tx);
  return items.length;
}

export async function clearBookCodes(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("codes", "readwrite");
  tx.objectStore("codes").clear();
  await txDone(tx);
}

export function loadBookSettings(): BookSettings {
  if (typeof localStorage === "undefined") return DEFAULT_BOOK_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_BOOK_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<BookSettings>;
    return {
      book: parsed.book === "hvac" || parsed.book === "invoice" || parsed.book === "all" ? parsed.book : "plumbing",
      hourWindow: [0.5, 1, 1.5, 2].includes(Number(parsed.hourWindow)) ? Number(parsed.hourWindow) : 1,
      partsPct: [0.1, 0.2, 0.25, 0.4].includes(Number(parsed.partsPct)) ? Number(parsed.partsPct) : 0.25,
      theme: parsed.theme === "field" || parsed.theme === "light" ? parsed.theme : "stock",
    };
  } catch {
    return DEFAULT_BOOK_SETTINGS;
  }
}

export function saveBookSettings(next: BookSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

export function recordsFromCsv(text: string, filename: string): BookCode[] {
  const rows = parseCsv(text);
  const out: BookCode[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const rec = rowToImport(row, filename);
    if (!rec) continue;
    const book = (rec.book === "hvac" || rec.book === "plumbing" || rec.book === "invoice" ? rec.book : "invoice") as CodeBookKind;
    const code = rec.code.trim().toUpperCase();
    const id = `${book}:${code}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      code,
      description: rec.description || code,
      category: rec.category || book,
      trade: rec.trade || book,
      book,
      hours: num(rec.hours),
      partsAllowance: num(rec.parts_allowance ?? rec.partsAllowance),
      laborValue: num(rec.labor_value ?? rec.laborValue ?? rec.list_price),
      notes: rec.notes ? String(rec.notes) : null,
    });
  }
  return out;
}

export async function importCsvText(text: string, filename: string): Promise<number> {
  const items = recordsFromCsv(text, filename);
  await upsertBookCodes(items);
  return items.length;
}

export async function importShopPack(kind: "plumbing" | "hvac" | "invoice" | "all"): Promise<number> {
  const files: { href: string; name: string }[] =
    kind === "all"
      ? [
          { href: "/samples/codes-plumbing.csv", name: "codes-plumbing.csv" },
          { href: "/samples/codes-hvac.csv", name: "codes-hvac.csv" },
          { href: "/samples/codes-invoice.csv", name: "codes-invoice.csv" },
        ]
      : [{ href: `/samples/codes-${kind}.csv`, name: `codes-${kind}.csv` }];
  let total = 0;
  for (const file of files) {
    const res = await fetch(file.href);
    if (!res.ok) throw new Error(`Could not load ${file.name}`);
    const text = await res.text();
    total += await importCsvText(text, file.name);
  }
  return total;
}
