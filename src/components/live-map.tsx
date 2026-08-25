import { initials } from "@/lib/utils";
import type { LiveTechRow } from "@/lib/field/types";
import { cn } from "@/lib/utils";

const BOUNDS = { minLat: 39.48, maxLat: 39.86, minLng: -75.88, maxLng: -75.32 };
const CITIES = [
  { name: "Wilmington", lat: 39.739, lng: -75.54 },
  { name: "New Castle", lat: 39.662, lng: -75.566 },
  { name: "Newark", lat: 39.684, lng: -75.75 },
  { name: "Bear", lat: 39.629, lng: -75.658 },
  { name: "Elkton", lat: 39.607, lng: -75.833 },
];

function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return {
    x: Math.min(96, Math.max(4, x)),
    y: Math.min(94, Math.max(6, y)),
  };
}

const DOT: Record<string, string> = {
  WORKING: "bg-ok",
  ON_SITE: "bg-ok",
  APPROACHING: "bg-warn",
  LEFT_SITE: "bg-danger",
  OFF_SITE: "bg-danger",
  OFFLINE: "bg-subtle",
};

export function LiveMap({ rows, compact }: { rows: LiveTechRow[]; compact?: boolean }) {
  const pins = rows.filter((r) => r.lastLat != null && r.lastLng != null);
  return (
    <div className={cn("flex h-full min-h-48 flex-col", compact && "min-h-0")}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-sm font-semibold">Live map</p>
        <p className="text-[10px] uppercase tracking-wide text-muted">
          {pins.length ? `${pins.length} GPS live` : "No GPS pins yet"}
        </p>
      </div>
      <div className="relative min-h-44 flex-1 overflow-hidden bg-elevated">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "18% 20%",
        }} />
        {CITIES.map((c) => {
          const p = project(c.lat, c.lng);
          return (
            <div
              key={c.name}
              className="absolute -translate-x-1/2 text-[10px] text-subtle"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="mb-1 block size-1 rounded-full bg-subtle" />
              {c.name}
            </div>
          );
        })}
        {pins.map((row) => {
          const p = project(row.lastLat!, row.lastLng!);
          return (
            <div
              key={row.employee.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              title={`${row.employee.name} · ${row.gpsStatus}`}
            >
              <div className={cn("grid size-8 place-items-center rounded-full text-[10px] font-semibold text-primary-fg shadow-[var(--shadow-border)]", DOT[row.gpsStatus] || "bg-primary")}>
                {initials(row.employee.name)}
              </div>
            </div>
          );
        })}
        {pins.length === 0 ? (
          <p className="absolute inset-x-4 bottom-3 text-center text-xs text-muted">
            Pins appear when a technician shares location from Today.
          </p>
        ) : null}
      </div>
    </div>
  );
}
