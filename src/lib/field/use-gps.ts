import { useCallback, useEffect, useRef, useState } from "react";

export type Fix = { lat: number; lng: number; accuracy: number };

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
        onPingRef.current?.(next);
      },
      (err) => {
        setPermission("denied");
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 5_000 },
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;
    request();
    const id = window.setInterval(request, Math.max(10, intervalSec) * 1000);
    return () => window.clearInterval(id);
  }, [enabled, intervalSec, request]);

  return { fix, error, permission, request };
}
