import type { GpsStatus } from "./types";

const EARTH_M = 6371000;

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function metersToFeet(m: number): number {
  return m * 3.28084;
}

export function resolveGpsStatus(opts: {
  hasFix: boolean;
  distanceFt: number | null;
  radiusFt: number;
  approachingMultiplier: number;
  clockedIn: boolean;
  previouslyOnSite?: boolean;
}): GpsStatus {
  if (!opts.hasFix) return "OFFLINE";
  if (opts.distanceFt == null) return "OFF_SITE";
  const approach = opts.radiusFt * opts.approachingMultiplier;
  if (opts.clockedIn && opts.distanceFt <= opts.radiusFt) return "WORKING";
  if (opts.previouslyOnSite && opts.distanceFt > opts.radiusFt) return "LEFT_SITE";
  if (opts.distanceFt <= opts.radiusFt) return "ON_SITE";
  if (opts.distanceFt <= approach) return "APPROACHING";
  return "OFF_SITE";
}

export const GPS_LABEL: Record<GpsStatus, string> = {
  OFF_SITE: "Off site",
  APPROACHING: "Approaching",
  ON_SITE: "On site",
  WORKING: "Working",
  LEFT_SITE: "Left site",
  OFFLINE: "Offline",
};
