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

export function effectiveRadiusFt(radiusFt: number, accuracyM?: number | null) {
  const extra = metersToFeet(Math.max(0, accuracyM ?? 0));
  return radiusFt + extra;
}

export function resolveGpsStatus(opts: {
  hasFix: boolean;
  distanceFt: number | null;
  radiusFt: number;
  approachingMultiplier: number;
  clockedIn: boolean;
  previouslyOnSite?: boolean;
  officeDistanceFt?: number | null;
  officeRadiusFt?: number;
  accuracyM?: number | null;
}): GpsStatus {
  if (!opts.hasFix) return "OFFLINE";
  const officeRadius = effectiveRadiusFt(opts.officeRadiusFt ?? 200, opts.accuracyM);
  if (opts.officeDistanceFt != null && opts.officeDistanceFt <= officeRadius) return "AT_OFFICE";
  if (opts.distanceFt == null) return "OFF_SITE";
  const radius = effectiveRadiusFt(opts.radiusFt, opts.accuracyM);
  const approach = radius * opts.approachingMultiplier;
  if (opts.clockedIn && opts.distanceFt <= radius) return "WORKING";
  if (opts.previouslyOnSite && opts.distanceFt > radius) return "LEFT_SITE";
  if (opts.distanceFt <= radius) return "ON_SITE";
  if (opts.distanceFt <= approach) return "APPROACHING";
  return "OFF_SITE";
}

export const GPS_LABEL: Record<GpsStatus, string> = {
  OFF_SITE: "Off site",
  APPROACHING: "In transit",
  ON_SITE: "On site",
  WORKING: "Working",
  LEFT_SITE: "Left site",
  AT_OFFICE: "At office",
  OFFLINE: "Offline",
};
