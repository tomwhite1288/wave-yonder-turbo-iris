import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, Download, Search, Settings, Smartphone, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { findMatchingCodes } from "@/lib/field/csv";
import type { CodeBookKind } from "@/lib/field/types";
import {
  clearBookCodes,
  importCsvText,
  importShopPack,
  listBookCodes,
  loadBookSettings,
  saveBookSettings,
  type BookCode,
  type BookSettings,
} from "@/lib/book/store";
import { formatHours, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/spinner";

type Tab = "search" | "library" | "settings";
type TradeFilter = "plumbing" | "hvac" | "all";

export function CodeBookApp() {
  const [ready, setReady] = useState(false);
  const [codes, setCodes] = useState<BookCode[]>([]);
  const [settings, setSettings] = useState<BookSettings>(loadBookSettings);
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [hours, setHours] = useState("");
  const [parts, setParts] = useState("");
  const [book, setBook] = useState<TradeFilter>(
    loadBookSettings().book === "hvac" ? "hvac" : loadBookSettings().book === "all" ? "all" : "plumbing",
  );
  const [picked, setPicked] = useState<BookCode | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [offline, setOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (settings.theme === "stock") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = settings.theme;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [settings.theme]);

  useEffect(() => {
    void listBookCodes()
      .then(setCodes)
      .catch(() => setCodes([]))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/book-sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  function persist(next: BookSettings) {
    setSettings(next);
    saveBookSettings(next);
  }

  async function reload() {
    setCodes(await listBookCodes());
  }

  async function loadPack(kind: "plumbing" | "hvac" | "invoice" | "all") {
    setBusy(kind);
    try {
      const n = await importShopPack(kind);
      await reload();
      toast.success(`${n} codes stored on this phone`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed — connect once to load shop files");
    } finally {
      setBusy(null);
    }
  }

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy("csv");
    try {
      let n = 0;
      for (const file of Array.from(list)) {
        n += await importCsvText(await file.text(), file.name);
      }
      await reload();
      toast.success(`${n} codes imported onto this phone`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that CSV");
    } finally {
      setBusy(null);
    }
  }

  const counts = useMemo(() => {
    const plumbing = codes.filter((c) => c.book === "plumbing").length;
    const hvac = codes.filter((c) => c.book === "hvac").length;
    const invoice = codes.filter((c) => c.book === "invoice").length;
    return { plumbing, hvac, invoice, total: codes.length };
  }, [codes]);

  const results = useMemo(() => {
    const hrs = hours.trim() ? Number(hours) : undefined;
    const pts = parts.trim() ? Number(parts) : undefined;
    return findMatchingCodes(codes, {
      query,
      hours: hrs,
      parts: pts,
      book,
      hourWindow: settings.hourWindow,
      partsPct: settings.partsPct,
    });
  }, [codes, query, hours, parts, book, settings.hourWindow, settings.partsPct]);

  if (!ready) return <Spinner label="Opening code book…" />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">Maichle's Edge</p>
            <h1 className="text-lg font-semibold tracking-tight">Code Book</h1>
          </div>
          {offline ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted">
              <WifiOff className="size-3.5" /> Offline
            </span>
          ) : (
            <span className="text-[11px] text-subtle">{counts.total ? `${counts.total} codes on phone` : "Not loaded yet"}</span>
          )}
        </div>
        {tab === "search" ? (
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-elevated p-1">
            {([
              { id: "plumbing", label: "Plumbing" },
              { id: "hvac", label: "HVAC" },
              { id: "all", label: "Both" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBook(opt.id)}
                className={`h-11 rounded-md text-sm font-medium ${
                  book === opt.id ? "bg-primary text-primary-fg" : "text-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <main className="flex-1 px-4 py-4 pb-28">
        {tab === "search" ? (
          <SearchPane
            query={query}
            hours={hours}
            parts={parts}
            setQuery={setQuery}
            setHours={setHours}
            setParts={setParts}
            results={results}
            empty={codes.length === 0}
            onPick={setPicked}
            onOpenLibrary={() => setTab("library")}
          />
        ) : null}
        {tab === "library" ? (
          <LibraryPane
            counts={counts}
            busy={busy}
            onLoad={loadPack}
            onFiles={onFiles}
            onClear={async () => {
              await clearBookCodes();
              setCodes([]);
              toast.success("Library cleared from this phone");
            }}
          />
        ) : null}
        {tab === "settings" ? (
          <SettingsPane
            settings={settings}
            installed={installed}
            offline={offline}
            onChange={persist}
          />
        ) : null}
      </main>

      {picked ? <CodeSheet code={picked} onClose={() => setPicked(null)} /> : null}

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {(
            [
              { id: "search", label: "Lookup", icon: Search },
              { id: "library", label: "Library", icon: BookOpen },
              { id: "settings", label: "Settings", icon: Settings },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const on = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${on ? "text-primary" : "text-muted"}`}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function SearchPane({
  query,
  hours,
  parts,
  setQuery,
  setHours,
  setParts,
  results,
  empty,
  onPick,
  onOpenLibrary,
}: {
  query: string;
  hours: string;
  parts: string;
  setQuery: (v: string) => void;
  setHours: (v: string) => void;
  setParts: (v: string) => void;
  results: { item: BookCode; tag: "match" | "range" | "search"; score: number }[];
  empty: boolean;
  onPick: (c: BookCode) => void;
  onOpenLibrary: () => void;
}) {
  const searching = Boolean(query.trim() || hours.trim() || parts.trim());
  return (
    <div className="space-y-3">
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Start typing a description…"
        className="h-12 text-base"
        autoCapitalize="none"
        autoCorrect="on"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          inputMode="decimal"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Hours on site"
          className="h-12"
        />
        <Input
          inputMode="decimal"
          value={parts}
          onChange={(e) => setParts(e.target.value)}
          placeholder="Parts $"
          className="h-12"
        />
      </div>
      <p className="text-xs text-muted">
        Type to narrow. Or enter how long you think you'll be out, and what parts might run — matching codes and near
        matches show up as you go.
      </p>

      {empty ? (
        <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-sm font-medium">Nothing on this phone yet</p>
          <p className="mt-1 text-sm text-muted">
            Load the shop HVAC and plumbing files once. After that the book lives here, even if the office site is down.
          </p>
          <Button className="mt-4 w-full" onClick={onOpenLibrary}>
            Open library
          </Button>
        </div>
      ) : searching ? (
        <ul className="space-y-2">
          {results.length === 0 ? (
            <li className="rounded-xl bg-surface px-4 py-6 text-sm text-muted shadow-[var(--shadow-border)]">
              No codes in that range. Try a shorter word, or widen hours.
            </li>
          ) : (
            results.map(({ item, tag }) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="w-full rounded-xl bg-surface px-4 py-3.5 text-left shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm text-primary">{item.code}</span>
                    <span className="text-[10px] uppercase tracking-wide text-subtle">
                      {item.book}
                      {tag === "match" ? " · match" : tag === "range" ? " · in range" : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-snug">{item.description}</p>
                  <p className="mt-2 font-mono text-xs tabular text-muted">
                    {formatHours(item.hours)}h · parts {formatMoney(item.partsAllowance)}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <p className="pt-6 text-center text-sm text-muted">Type a description, hours, or parts cost.</p>
      )}
    </div>
  );
}

function LibraryPane({
  counts,
  busy,
  onLoad,
  onFiles,
  onClear,
}: {
  counts: { plumbing: number; hvac: number; invoice: number; total: number };
  busy: string | null;
  onLoad: (kind: "plumbing" | "hvac" | "invoice" | "all") => void;
  onFiles: (files: FileList | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <CountTile label="Plumbing" value={counts.plumbing} />
        <CountTile label="HVAC" value={counts.hvac} />
        <CountTile label="Invoice" value={counts.invoice} />
      </div>
      <section className="space-y-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Shop files</h2>
        <p className="text-sm text-muted">One tap loads the converted plumbing and HVAC books onto this phone.</p>
        <Button className="w-full" disabled={Boolean(busy)} onClick={() => onLoad("all")}>
          {busy === "all" ? "Loading…" : "Load plumbing + HVAC"}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={Boolean(busy)} onClick={() => onLoad("plumbing")}>
            Plumbing
          </Button>
          <Button variant="secondary" disabled={Boolean(busy)} onClick={() => onLoad("hvac")}>
            HVAC
          </Button>
        </div>
      </section>
      <section className="space-y-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Import CSV</h2>
        <p className="text-sm text-muted">
          Same columns as the office pack: book, code, description, hours, parts_allowance.
        </p>
        <label className="flex h-12 cursor-pointer items-center justify-center rounded-md bg-elevated text-sm">
          <Download className="mr-2 size-4" />
          {busy === "csv" ? "Importing…" : "Choose CSV files"}
          <input
            type="file"
            accept=".csv,text/csv"
            multiple
            className="sr-only"
            disabled={Boolean(busy)}
            onChange={(e) => {
              void onFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
      </section>
      {counts.total > 0 ? (
        <button type="button" className="w-full text-sm text-muted" onClick={() => void onClear()}>
          Clear library from this phone
        </button>
      ) : null}
    </div>
  );
}

function SettingsPane({
  settings,
  installed,
  offline,
  onChange,
}: {
  settings: BookSettings;
  installed: boolean;
  offline: boolean;
  onChange: (s: BookSettings) => void;
}) {
  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Add to Home Screen</h2>
        {installed ? (
          <p className="text-sm text-muted">This copy is running as an app. The office site can go down; the book stays.</p>
        ) : (
          <ol className="space-y-2 text-sm text-muted">
            <li>1. Load plumbing and HVAC while you still have signal.</li>
            <li>2. iPhone: Share → Add to Home Screen.</li>
            <li>3. Android: browser menu → Add to Home screen.</li>
            <li>4. Open the icon. After that, the lookup does not need the server.</li>
          </ol>
        )}
        <p className="inline-flex items-center gap-2 text-xs text-subtle">
          <Smartphone className="size-3.5" />
          {offline ? "No network — using the copy on this phone" : "Online — will refresh shop files if you import"}
        </p>
      </section>
      <section className="space-y-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Hour window</h2>
        <p className="text-xs text-muted">How close a code's typical hours must be to what you typed.</p>
        <div className="grid grid-cols-4 gap-1">
          {[0.5, 1, 1.5, 2].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ ...settings, hourWindow: n })}
              className={`h-11 rounded-md text-sm ${
                settings.hourWindow === n ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
              }`}
            >
              ±{n}h
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Parts range</h2>
        <p className="text-xs text-muted">Allowance window above the parts number you enter.</p>
        <div className="grid grid-cols-4 gap-1">
          {[
            { n: 0.1, l: "10%" },
            { n: 0.2, l: "20%" },
            { n: 0.25, l: "25%" },
            { n: 0.4, l: "40%" },
          ].map((opt) => (
            <button
              key={opt.n}
              type="button"
              onClick={() => onChange({ ...settings, partsPct: opt.n })}
              className={`h-11 rounded-md text-sm ${
                settings.partsPct === opt.n ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Look</h2>
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              { id: "stock", label: "Stock" },
              { id: "field", label: "Field" },
              { id: "light", label: "Light" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...settings, theme: t.id })}
              className={`h-11 rounded-md text-sm ${
                settings.theme === t.id ? "bg-primary text-primary-fg" : "bg-elevated text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-3 shadow-[var(--shadow-border)]">
      <div className="text-[11px] uppercase tracking-wide text-subtle">{label}</div>
      <div className="font-mono text-lg tabular">{value}</div>
    </div>
  );
}

function CodeSheet({ code, onClose }: { code: BookCode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40">
      <button type="button" className="absolute inset-0 bg-bg/70" onClick={onClose} aria-label="Close" />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-elevated" />
        <p className="font-mono text-sm text-primary">{code.code}</p>
        <h2 className="mt-1 text-lg font-semibold leading-snug">{code.description}</h2>
        <p className="mt-1 text-xs uppercase tracking-wide text-subtle">
          {code.book} · {code.category}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-elevated px-3 py-3">
            <div className="text-[11px] uppercase tracking-wide text-subtle">Typical hours</div>
            <div className="font-mono text-xl tabular">{formatHours(code.hours)}</div>
          </div>
          <div className="rounded-xl bg-elevated px-3 py-3">
            <div className="text-[11px] uppercase tracking-wide text-subtle">Parts allowance</div>
            <div className="font-mono text-xl tabular">{formatMoney(code.partsAllowance)}</div>
          </div>
        </div>
        {code.laborValue ? (
          <p className="mt-3 text-sm text-muted">List / labor {formatMoney(code.laborValue)}</p>
        ) : null}
        {code.notes ? <p className="mt-2 text-xs text-subtle">{code.notes}</p> : null}
        <Button
          className="mt-4 w-full"
          onClick={() => {
            void navigator.clipboard?.writeText(code.code).then(
              () => toast.success("Code copied"),
              () => toast.error("Could not copy"),
            );
          }}
        >
          <Check className="size-4" />
          Copy code
        </Button>
      </div>
    </div>
  );
}
