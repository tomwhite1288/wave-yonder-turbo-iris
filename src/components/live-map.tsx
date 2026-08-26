import { initials } from "@/lib/utils";
import type { LiveTechRow } from "@/lib/field/types";
import { cn } from "@/lib/utils";
import { GPS_LABEL } from "@/lib/field/geo";

function projectMercator(lat: number, lng: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export function LiveMap({
  rows,
  officeLat,
  officeLng,
  compact,
}: {
  rows: LiveTechRow[];
  officeLat?: number;
  officeLng?: number;
  compact?: boolean;
}) {
  const pins = rows.filter((r) => r.lastLat != null && r.lastLng != null);
  const centerLat = pins[0]?.lastLat ?? officeLat ?? 39.662;
  const centerLng = pins[0]?.lastLng ?? officeLng ?? -75.566;
  const zoom = pins.length > 1 ? 11 : 13;
  const origin = projectMercator(centerLat, centerLng, zoom);
  const tileX = Math.floor(origin.x / 256);
  const tileY = Math.floor(origin.y / 256);
  const tiles: { tx: number; ty: number }[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      tiles.push({ tx: tileX + dx, ty: tileY + dy });
    }
  }
  const width = 256 * 3;
  const height = 256 * 3;
  const originPx = { x: origin.x - (tileX - 1) * 256, y: origin.y - (tileY - 1) * 256 };

  function pinStyle(lat: number, lng: number) {
    const p = projectMercator(lat, lng, zoom);
    return {
      left: p.x - (tileX - 1) * 256,
      top: p.y - (tileY - 1) * 256,
    };
  }

  const DOT: Record<string, string> = {
    WORKING: "bg-ok",
    ON_SITE: "bg-ok",
    AT_OFFICE: "bg-info",
    APPROACHING: "bg-warn",
    LEFT_SITE: "bg-danger",
    OFF_SITE: "bg-danger",
    OFFLINE: "bg-subtle",
  };

  return (
    <div className={cn("flex h-full min-h-56 flex-col", compact && "min-h-0")}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-sm font-semibold">Live map</p>
        <p className="text-[10px] uppercase tracking-wide text-muted">
          {pins.length ? `${pins.length} GPS live` : "Waiting for a GPS ping"}
        </p>
      </div>
      <div className="relative min-h-52 flex-1 overflow-hidden bg-elevated">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width, height }}>
          {tiles.map((t) => (
            <img
              key={`${t.tx}-${t.ty}`}
              alt=""
              className="absolute"
              style={{
                left: (t.tx - (tileX - 1)) * 256,
                top: (t.ty - (tileY - 1)) * 256,
                width: 256,
                height: 256,
              }}
              src={`https://tile.openstreetmap.org/${zoom}/${t.tx}/${t.ty}.png`}
            />
          ))}
          {officeLat != null && officeLng != null ? (
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={pinStyle(officeLat, officeLng)}
              title="Shop"
            >
              <div className="size-3 rounded-full bg-primary ring-4 ring-primary/30" />
            </div>
          ) : null}
          {pins.map((row) => {
            const pos = pinStyle(row.lastLat!, row.lastLng!);
            return (
              <div
                key={row.employee.id}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={pos}
                title={`${row.employee.name} · ${GPS_LABEL[row.gpsStatus]}`}
              >
                <div
                  className={cn(
                    "grid size-8 place-items-center rounded-full text-[10px] font-semibold text-primary-fg shadow-[var(--shadow-border)]",
                    DOT[row.gpsStatus] || "bg-primary",
                  )}
                >
                  {initials(row.employee.name)}
                </div>
              </div>
            );
          })}
        </div>
        {pins.length === 0 ? (
          <p className="absolute inset-x-4 bottom-3 z-30 text-center text-xs text-muted">
            Open Today, allow location, tap Confirm GPS. Pins stay on this map.
          </p>
        ) : null}
        <p className="absolute bottom-1 right-2 z-30 text-[10px] text-subtle">© OpenStreetMap</p>
      </div>
    </div>
  );
}
