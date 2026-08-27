import { useCallback, useEffect, useRef, useState } from "react";

export type Fix = { lat: number; lng: number; accuracy: number };

const QUEUE_KEY = "fl_gps_queue";

export function queueGpsFix(fix: Fix & { ticketId?: string }) {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const q: Array<Fix & { ticketId?: string; at: number }> = raw ? JSON.parse(raw) : [];
    q.push({ ...fix, at: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50)));
  } catch {
    /* private mode */
  }
}

export function takeQueuedGps(): Array<Fix & { ticketId?: string }> {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    localStorage.removeItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function movedMeters(a: Fix, b: Fix) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function useGps(enabled: boolean, intervalSec: number, onPing?: (fix: Fix) => void) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const onPingRef = useRef(onPing);
  onPingRef.current = onPing;
  const lastSent = useRef<{ fix: Fix; at: number } | null>(null);

  const apply = useCallback((pos: GeolocationPosition) => {
    const next = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
    setFix(next);
    setPermission("granted");
    setError(null);
    queueGpsFix(next);
    const prev = lastSent.current;
    const minMs = Math.max(12, Math.min(intervalSec, 45)) * 1000;
    const accuracyBetter = prev ? next.accuracy + 8 < prev.fix.accuracy : true;
    const moved = prev ? movedMeters(prev.fix, next) > 18 : true;
    const due = !prev || Date.now() - prev.at >= minMs;
    if (!prev || due || accuracyBetter || moved) {
      lastSent.current = { fix: next, at: Date.now() };
      onPingRef.current?.(next);
    }
  }, [intervalSec]);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      setError("This device does not expose location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      apply,
      (err) => {
        setPermission("denied");
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 25_000, maximumAge: 8_000 },
    );
  }, [apply]);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;
    request();
    const watch = navigator.geolocation.watchPosition(
      apply,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermission("denied");
          setError(err.message);
        }
      },
      { enableHighAccuracy: true, timeout: 25_000, maximumAge: 5_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [enabled, apply, request]);

  return { fix, error, permission, request };
}
