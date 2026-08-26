import { Badge } from "@/components/ui/badge";
import { GPS_LABEL } from "./geo";
import type { GpsStatus } from "./types";

const tone: Record<GpsStatus, "ok" | "warn" | "danger" | "info" | "neutral"> = {
  WORKING: "ok",
  ON_SITE: "ok",
  AT_OFFICE: "info",
  APPROACHING: "warn",
  LEFT_SITE: "danger",
  OFF_SITE: "danger",
  OFFLINE: "neutral",
};

export function GpsBadge({ status }: { status: GpsStatus }) {
  return <Badge tone={tone[status]}>{GPS_LABEL[status]}</Badge>;
}

const exceptionTone: Record<string, "ok" | "warn" | "danger" | "info" | "neutral"> = {
  under_billed: "warn",
  over_billed: "warn",
  missing_code: "warn",
  invalid_code: "warn",
  missing_time: "warn",
  unpaid_claim: "danger",
  payroll: "danger",
  left_site: "danger",
  gps_mismatch: "warn",
  office_mismatch: "danger",
  travel_mismatch: "warn",
  parts_over_allowance: "warn",
  late: "info",
  early: "info",
  overtime: "info",
  note: "neutral",
};

export function ExceptionTone({ kind }: { kind: string }) {
  return <Badge tone={exceptionTone[kind] ?? "info"}>{kind.replaceAll("_", " ")}</Badge>;
}
