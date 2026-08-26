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

export function useGps(enabled: boolean, intervalSec: number, onPing?: (fix: Fix) => void) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const onPingRef = useRef(onPing);
  onPingRef.current = onPing;

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      setError("This device does not expose location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setFix(next);
        setPermission("granted");
        setError(null);
        queueGpsFix(next);
        onPingRef.current?.(next);
      },
      (err) => {
        setPermission("denied");
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 30_000 },
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;
    request();
    const ms = Math.max(60, intervalSec) * 1000;
    const id = window.setInterval(request, ms);
    return () => window.clearInterval(id);
  }, [enabled, intervalSec, request]);

  return { fix, error, permission, request };
}
