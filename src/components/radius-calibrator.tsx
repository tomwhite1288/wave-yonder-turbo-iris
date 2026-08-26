import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

function projectMercator(lat: number, lng: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function metersPerPixel(lat: number, zoom: number) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

export function RadiusCalibrator({
  lat,
  lng,
  radiusFt,
  onChange,
  onUseHere,
  label = "Job-site radius",
}: {
  lat: number;
  lng: number;
  radiusFt: number;
  onChange: (ft: number) => void;
  onUseHere?: (lat: number, lng: number) => void;
  label?: string;
}) {
  const zoom = 16;
  const origin = useMemo(() => projectMercator(lat, lng, zoom), [lat, lng]);
  const tileX = Math.floor(origin.x / 256);
  const tileY = Math.floor(origin.y / 256);
  const mpp = metersPerPixel(lat, zoom);
  const radiusPx = (radiusFt * 0.3048) / mpp;
  const size = 256 * 3;
  const center = {
    x: origin.x - (tileX - 1) * 256,
    y: origin.y - (tileY - 1) * 256,
  };
  const [busy, setBusy] = useState(false);
  const tiles: { tx: number; ty: number }[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) tiles.push({ tx: tileX + dx, ty: tileY + dy });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="font-mono text-sm tabular">{Math.round(radiusFt)} ft</p>
      </div>
      <div className="relative h-56 overflow-hidden rounded-xl bg-elevated">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: size, height: size }}>
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
          <div
            className="absolute rounded-full border-2 border-primary bg-primary/15"
            style={{
              width: radiusPx * 2,
              height: radiusPx * 2,
              left: center.x - radiusPx,
              top: center.y - radiusPx,
            }}
          />
          <div
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: center.x, top: center.y }}
          />
        </div>
      </div>
      <input
        type="range"
        min={50}
        max={800}
        step={10}
        value={radiusFt}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      {onUseHere ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => {
            if (!navigator.geolocation) return;
            setBusy(true);
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                onUseHere(pos.coords.latitude, pos.coords.longitude);
                setBusy(false);
              },
              () => setBusy(false),
              { enableHighAccuracy: true, timeout: 20_000 },
            );
          }}
        >
          {busy ? "Locating…" : "Center on this device"}
        </Button>
      ) : null}
    </div>
  );
}
