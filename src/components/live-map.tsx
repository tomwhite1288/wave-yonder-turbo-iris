import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { initials } from "@/lib/utils";
import type { LiveTechRow } from "@/lib/field/types";
import { cn } from "@/lib/utils";
import { GPS_LABEL } from "@/lib/field/geo";

function projectMercator(lat: number, lng: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const sin = Math.min(0.9999, Math.max(-0.9999, Math.sin((lat * Math.PI) / 180)));
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function unproject(x: number, y: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

const MIN_Z = 8;
const MAX_Z = 18;

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
  const seedLat = pins[0]?.lastLat ?? officeLat ?? 39.662;
  const seedLng = pins[0]?.lastLng ?? officeLng ?? -75.566;
  const [zoom, setZoom] = useState(pins.length > 1 ? 12 : 14);
  const [center, setCenter] = useState({ lat: seedLat, lng: seedLng });
  const [size, setSize] = useState({ w: 640, h: 360 });
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; lat: number; lng: number } | null>(null);

  function zoomBy(delta: number, around?: { x: number; y: number }) {
    setZoom((prev) => {
      const next = Math.min(MAX_Z, Math.max(MIN_Z, prev + delta));
      if (next === prev) return prev;
      if (around && box.current) {
        const rect = box.current.getBoundingClientRect();
        const px = around.x - rect.left - size.w / 2;
        const py = around.y - rect.top - size.h / 2;
        const world = projectMercator(center.lat, center.lng, prev);
        const target = { x: world.x + px, y: world.y + py };
        const geo = unproject(target.x, target.y, prev);
        const after = projectMercator(geo.lat, geo.lng, next);
        const newOrigin = { x: after.x - px, y: after.y - py };
        setCenter(unproject(newOrigin.x, newOrigin.y, next));
      }
      return next;
    });
  }
  const zoomFn = useRef(zoomBy);
  zoomFn.current = zoomBy;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth || 640, h: el.clientHeight || 360 });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const wheel = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      zoomFn.current(e.deltaY > 0 ? -1 : 1, { x: e.clientX, y: e.clientY });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", wheel);
    };
  }, []);

  useEffect(() => {
    if (drag.current) return;
    if (pins[0]?.lastLat != null && pins[0]?.lastLng != null) {
      setCenter((c) =>
        Math.abs(c.lat - pins[0]!.lastLat!) + Math.abs(c.lng - pins[0]!.lastLng!) > 0.08
          ? { lat: pins[0]!.lastLat!, lng: pins[0]!.lastLng! }
          : c,
      );
    }
  }, [pins]);

  const z = Math.round(Math.min(MAX_Z, Math.max(MIN_Z, zoom)));
  const origin = projectMercator(center.lat, center.lng, z);
  const cols = Math.ceil(size.w / 256) + 2;
  const rowsN = Math.ceil(size.h / 256) + 2;
  const tileX0 = Math.floor(origin.x / 256) - Math.floor(cols / 2);
  const tileY0 = Math.floor(origin.y / 256) - Math.floor(rowsN / 2);
  const nTiles = 2 ** z;

  const tiles = useMemo(() => {
    const out: { tx: number; ty: number; ox: number; oy: number }[] = [];
    for (let ty = tileY0; ty < tileY0 + rowsN; ty += 1) {
      for (let tx = tileX0; tx < tileX0 + cols; tx += 1) {
        const wrappedX = ((tx % nTiles) + nTiles) % nTiles;
        if (ty < 0 || ty >= nTiles) continue;
        out.push({ tx: wrappedX, ty, ox: tx, oy: ty });
      }
    }
    return out;
  }, [tileX0, tileY0, cols, rowsN, nTiles]);

  function pinStyle(lat: number, lng: number) {
    const p = projectMercator(lat, lng, z);
    return {
      left: p.x - origin.x + size.w / 2,
      top: p.y - origin.y + size.h / 2,
    };
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, lat: center.lat, lng: center.lng };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    const world = projectMercator(drag.current.lat, drag.current.lng, z);
    setCenter(unproject(world.x - dx, world.y - dy, z));
  }
  function onPointerUp() {
    drag.current = null;
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
        <p className="text-xs uppercase tracking-wide text-muted">
          {pins.length ? `${pins.length} GPS live` : "Waiting for a GPS ping"} · z{z}
        </p>
      </div>
      <div
        ref={box}
        className="relative min-h-52 flex-1 cursor-grab overflow-hidden bg-elevated active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {tiles.map((t) => (
          <img
            key={`${z}-${t.ox}-${t.oy}`}
            alt=""
            draggable={false}
            className="pointer-events-none absolute select-none"
            style={{
              left: t.ox * 256 - origin.x + size.w / 2,
              top: t.oy * 256 - origin.y + size.h / 2,
              width: 256,
              height: 256,
            }}
            src={`https://tile.openstreetmap.org/${z}/${t.tx}/${t.ty}.png`}
          />
        ))}
        {officeLat != null && officeLng != null ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
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
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={pos}
              title={`${row.employee.name} · ${GPS_LABEL[row.gpsStatus]}`}
            >
              <div
                className={cn(
                  "grid size-8 place-items-center rounded-full text-xs font-semibold text-primary-fg shadow-[var(--shadow-border)]",
                  DOT[row.gpsStatus] || "bg-primary",
                )}
              >
                {initials(row.employee.name)}
              </div>
            </div>
          );
        })}
        <div className="absolute right-2 top-2 z-30 flex flex-col gap-1">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md bg-surface text-fg shadow-[var(--shadow-border)]"
            onClick={() => zoomBy(1)}
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md bg-surface text-fg shadow-[var(--shadow-border)]"
            onClick={() => zoomBy(-1)}
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
          </button>
        </div>
        {pins.length === 0 ? (
          <p className="absolute inset-x-4 bottom-3 z-30 text-center text-xs text-muted">
            Open Today, allow location, tap Confirm GPS. Scroll or pinch to zoom. Drag to pan.
          </p>
        ) : null}
        <p className="pointer-events-none absolute bottom-1 left-2 z-30 text-xs text-subtle">© OpenStreetMap</p>
      </div>
    </div>
  );
}
