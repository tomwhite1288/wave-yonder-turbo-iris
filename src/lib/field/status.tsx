import { Badge } from "@/components/ui/badge";
import { GPS_LABEL } from "./geo";
import type { GpsStatus } from "./types";

const tone: Record<GpsStatus, "ok" | "warn" | "danger" | "info" | "neutral"> = {
  WORKING: "ok",
  ON_SITE: "ok",
  APPROACHING: "warn",
  LEFT_SITE: "danger",
  OFF_SITE: "danger",
  OFFLINE: "neutral",
};

export function GpsBadge({ status }: { status: GpsStatus }) {
  return <Badge tone={tone[status]}>{GPS_LABEL[status]}</Badge>;
}

export function ExceptionTone({ kind }: { kind: string }) {
  if (kind === "under_billed" || kind === "over_billed" || kind === "invalid_code") {
    return <Badge tone="warn">{kind.replaceAll("_", " ")}</Badge>;
  }
  if (kind === "left_site" || kind === "payroll") {
    return <Badge tone="danger">{kind.replaceAll("_", " ")}</Badge>;
  }
  return <Badge tone="info">{kind.replaceAll("_", " ")}</Badge>;
}
