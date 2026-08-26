import { todayIso } from "@/lib/utils";
import type {
  ClaimResult,
  CompanySettings,
  DayHours,
  EfficiencyRow,
  Employee,
  PaidKind,
  PayCondition,
  PayConditions,
  PayrollRow,
  TimeKind,
  TimeEntryView,
} from "./types";

export const PAID_KIND_OPTIONS: { id: PaidKind; label: string; hint: string }[] = [
  { id: "travel", label: "In transit", hint: "Drive time between the shop and the job" },
  { id: "show", label: "Show / arrived", hint: "On site before work starts" },
  { id: "work", label: "Working on site", hint: "Diagnose, repair, install" },
  { id: "office", label: "Office allocation", hint: "GPS-confirmed at the shop address" },
];

export const KIND_LABEL: Record<TimeKind, string> = {
  travel: "In transit",
  show: "Show / arrived",
  work: "Working",
  office: "Office",
  break: "Break",
  admin: "Admin",
  non_billable: "Not paid",
};

export function minutesBetween(startIso: string, endIso: string | null, now = new Date()): number {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : now.getTime();
  return Math.max(0, (end - start) / 60000);
}

export function weekRange(timezone: string, offsetWeeks = 0) {
  const today = todayIso(timezone);
  const d = new Date(`${today}T12:00:00-04:00`);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset + offsetWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { from: iso(monday), to: iso(sunday), today };
}

export function parsePaidKinds(raw: string | null | undefined): PaidKind[] {
  const fallback: PaidKind[] = ["travel", "show", "work", "office"];
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;
    const allowed = new Set<PaidKind>(["travel", "show", "work", "office"]);
    const ids = parsed.filter((x): x is PaidKind => typeof x === "string" && allowed.has(x as PaidKind));
    return ids.length ? ids : fallback;
  } catch {
    return fallback;
  }
}

export const DEFAULT_PAY_CONDITIONS: PayConditions = {
  travel: { requireGps: true, flagOnFail: false, requireApproval: false },
  show: { requireGps: true, flagOnFail: true, requireApproval: true },
  work: { requireGps: true, flagOnFail: true, requireApproval: true },
  office: { requireGps: true, flagOnFail: true, requireApproval: false },
};

export function parsePayConditions(raw: string | null | undefined): PayConditions {
  const base: PayConditions = {
    travel: { ...DEFAULT_PAY_CONDITIONS.travel },
    show: { ...DEFAULT_PAY_CONDITIONS.show },
    work: { ...DEFAULT_PAY_CONDITIONS.work },
    office: { ...DEFAULT_PAY_CONDITIONS.office },
  };
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<PaidKind, Partial<PayCondition>>>;
    if (!parsed || typeof parsed !== "object") return base;
    for (const kind of ["travel", "show", "work", "office"] as PaidKind[]) {
      const row = parsed[kind];
      if (!row) continue;
      if (typeof row.requireGps === "boolean") base[kind].requireGps = row.requireGps;
      if (typeof row.flagOnFail === "boolean") base[kind].flagOnFail = row.flagOnFail;
      if (typeof row.requireApproval === "boolean") base[kind].requireApproval = row.requireApproval;
    }
    return base;
  } catch {
    return base;
  }
}

export function evaluateClaim(opts: {
  kind: TimeKind;
  gpsStatus: string | null;
  settings: CompanySettings;
}): ClaimResult {
  const status = opts.gpsStatus ?? "OFFLINE";
  if (opts.kind === "break" || opts.kind === "non_billable") {
    return { paid: false, gpsBacked: true, reason: null };
  }
  const paidSet = new Set(opts.settings.paidKinds);
  if (opts.kind === "admin") {
    const officeOk = status === "AT_OFFICE" && paidSet.has("office");
    if (officeOk) return { paid: true, gpsBacked: true, reason: null };
    return { paid: false, gpsBacked: status === "AT_OFFICE", reason: "Office/admin time is only paid at the shop address." };
  }
  const kind = opts.kind as PaidKind;
  if (!paidSet.has(kind)) {
    return { paid: false, gpsBacked: true, reason: `${opts.kind} is tracked, not paid.` };
  }
  const cond = opts.settings.payConditions?.[kind];
  const needGps = cond?.requireGps ?? opts.settings.requireGpsForPay;
  if (!needGps) {
    return { paid: true, gpsBacked: status !== "OFFLINE", reason: null };
  }
  if (status === "OFFLINE") {
    return { paid: true, gpsBacked: false, reason: null };
  }
  const onSite = status === "ON_SITE" || status === "WORKING";
  const inTransit = status === "APPROACHING" || status === "OFF_SITE" || status === "LEFT_SITE";
  if (kind === "work" || kind === "show") {
    if (onSite) return { paid: true, gpsBacked: true, reason: null };
    return {
      paid: false,
      gpsBacked: false,
      reason: `GPS is ${status.replaceAll("_", " ").toLowerCase()} — on-site time is only paid inside the job radius.`,
    };
  }
  if (kind === "travel") {
    if (inTransit || status === "APPROACHING") return { paid: true, gpsBacked: true, reason: null };
    if (status === "AT_OFFICE") {
      return { paid: false, gpsBacked: false, reason: "Travel claimed while GPS is at the office." };
    }
    if (onSite) {
      return { paid: false, gpsBacked: false, reason: "Travel claimed while GPS is on the job site — clock arrived/working." };
    }
    return { paid: false, gpsBacked: false, reason: "Travel is not GPS-backed." };
  }
  if (kind === "office") {
    if (status === "AT_OFFICE") return { paid: true, gpsBacked: true, reason: null };
    return { paid: false, gpsBacked: false, reason: "Office allocation is only paid inside the shop geofence." };
  }
  return { paid: false, gpsBacked: false, reason: "Not a payable status." };
}

export function settleMinutes(totalMin: number, claim: ClaimResult) {
  if (claim.paid) return { paid: totalMin, unpaid: 0, billable: totalMin, nonBillable: 0 };
  return { paid: 0, unpaid: totalMin, billable: 0, nonBillable: totalMin };
}

export function emptyDayHours(): DayHours {
  return {
    billable: 0,
    nonBillable: 0,
    admin: 0,
    travel: 0,
    show: 0,
    office: 0,
    breakMin: 0,
    worked: 0,
    paid: 0,
    unpaid: 0,
  };
}

export function addDayHours(acc: DayHours, add: DayHours): DayHours {
  return {
    billable: acc.billable + add.billable,
    nonBillable: acc.nonBillable + add.nonBillable,
    admin: acc.admin + add.admin,
    travel: acc.travel + add.travel,
    show: acc.show + add.show,
    office: acc.office + add.office,
    breakMin: acc.breakMin + add.breakMin,
    worked: acc.worked + add.worked,
    paid: acc.paid + add.paid,
    unpaid: acc.unpaid + add.unpaid,
  };
}

export function hoursFromEntries(entries: TimeEntryView[], now = new Date()): DayHours {
  return entries.reduce((acc, entry) => {
    const total = minutesBetween(entry.clockIn, entry.clockOut, now);
    const paid = entry.paidMinutes || (entry.gpsBacked && entry.kind !== "break" ? total : 0);
    const unpaid = entry.unpaidMinutes || Math.max(0, total - paid);
    const next = emptyDayHours();
    next.worked = entry.kind === "break" ? 0 : total;
    next.paid = paid;
    next.unpaid = unpaid;
    next.billable = entry.kind === "work" || entry.kind === "show" ? paid : 0;
    next.nonBillable = unpaid;
    if (entry.kind === "admin") next.admin = total;
    if (entry.kind === "travel") next.travel = paid || total;
    if (entry.kind === "show") next.show = paid || total;
    if (entry.kind === "office") next.office = paid || total;
    if (entry.kind === "break") next.breakMin = total;
    return addDayHours(acc, next);
  }, emptyDayHours());
}

export function splitOvertime(
  workedHours: number,
  settings: CompanySettings,
): { regular: number; overtime: number; doubleTime: number } {
  const daily = settings.overtimeWeeklyHours;
  if (workedHours <= daily) return { regular: workedHours, overtime: 0, doubleTime: 0 };
  const extra = workedHours - daily;
  if (settings.doubleTimeEnabled && extra > 4) {
    return { regular: daily, overtime: 4, doubleTime: extra - 4 };
  }
  return { regular: daily, overtime: extra, doubleTime: 0 };
}

export function payrollForEmployee(opts: {
  employee: Employee;
  hours: DayHours;
  settings: CompanySettings;
  laborRevenue: number;
  partsRevenue: number;
}): PayrollRow {
  const paidHours = opts.hours.paid / 60;
  const split = splitOvertime(paidHours, opts.settings);
  const wage = opts.employee.hourlyWage;
  const grossRegular = split.regular * wage;
  const grossOvertime =
    split.overtime * wage * opts.settings.overtimeMultiplier + split.doubleTime * wage * 2;
  const totalWages = grossRegular + grossOvertime;
  const taxFed = totalWages * (opts.settings.payrollFedPct / 100);
  const taxState = totalWages * (opts.settings.payrollStatePct / 100);
  const taxFica = totalWages * (opts.settings.payrollFicaPct / 100);
  const totalRevenue = opts.laborRevenue + opts.partsRevenue;
  const laborHours = Math.max(paidHours, 0.0001);
  return {
    employee: opts.employee,
    regularHours: split.regular,
    overtimeHours: split.overtime,
    doubleTimeHours: split.doubleTime,
    paidHours,
    unpaidHours: opts.hours.unpaid / 60,
    travelHours: opts.hours.travel / 60,
    showHours: opts.hours.show / 60,
    workHours: opts.hours.billable / 60,
    officeHours: opts.hours.office / 60,
    grossRegular,
    grossOvertime,
    totalWages,
    taxFed,
    taxState,
    taxFica,
    netPay: totalWages - taxFed - taxState - taxFica,
    billableHours: opts.hours.billable / 60,
    nonBillableHours: opts.hours.nonBillable / 60,
    adminHours: opts.hours.admin / 60,
    laborRevenue: opts.laborRevenue,
    partsRevenue: opts.partsRevenue,
    totalRevenue,
    revenuePerLaborHour: totalRevenue / laborHours,
    laborCostPct: totalRevenue > 0 ? totalWages / totalRevenue : 0,
    contributionAfterLabor: totalRevenue - totalWages,
  };
}

export function efficiencyForEmployee(opts: {
  employee: Employee;
  hours: DayHours;
  availableHours: number;
  soldHours: number;
  settings: CompanySettings;
  laborRevenue: number;
  partsRevenue: number;
}): EfficiencyRow {
  const jobHours = (opts.hours.billable + opts.hours.show) / 60;
  const driveHours = opts.hours.travel / 60;
  const officeHours = opts.hours.office / 60;
  const paidHours = opts.hours.paid / 60;
  const actualWorked = opts.hours.worked / 60;
  const available = Math.max(opts.availableHours, 0);
  const sold = Math.max(opts.soldHours, 0);
  const fieldHours =
    jobHours + (opts.settings.travelCountsAsField ? driveHours : 0);
  const totalRevenue = opts.laborRevenue + opts.partsRevenue;
  return {
    employee: opts.employee,
    availableHours: available,
    actualWorkedHours: actualWorked,
    soldHours: sold,
    jobHours,
    driveHours,
    officeHours,
    paidHours,
    unpaidHours: opts.hours.unpaid / 60,
    billableHours: jobHours,
    nonBillableHours: opts.hours.nonBillable / 60,
    adminHours: opts.hours.admin / 60,
    travelHours: driveHours,
    fieldHours,
    billableEfficiency: available > 0 ? sold / available : 0,
    jobEfficiency: jobHours > 0 ? sold / jobHours : 0,
    fieldUtilization: available > 0 ? jobHours / available : 0,
    laborRevenue: opts.laborRevenue,
    partsRevenue: opts.partsRevenue,
    totalRevenue,
    revenuePerBillableHour: sold > 0 ? totalRevenue / sold : 0,
    revenuePerFieldHour: fieldHours > 0 ? totalRevenue / fieldHours : 0,
    grossContribution: totalRevenue - paidHours * opts.employee.hourlyWage,
  };
}

export function discrepancyKind(
  actualOnSiteHours: number,
  expectedHours: number,
  toleranceMin: number,
  hasCodes: boolean,
): "under_billed" | "over_billed" | "missing_code" | null {
  if (actualOnSiteHours > 0.05 && !hasCodes) return "missing_code";
  const deltaMin = (actualOnSiteHours - expectedHours) * 60;
  if (deltaMin > toleranceMin) return "under_billed";
  if (deltaMin < -toleranceMin && expectedHours > 0) return "over_billed";
  return null;
}

export function roughGrossProfit(opts: {
  laborValue: number;
  receiptCost: number;
  partsMarkup: number;
  paidHours: number;
  wage: number;
}) {
  const partsSell = opts.receiptCost * opts.partsMarkup;
  const sold = opts.laborValue + partsSell;
  const cost = opts.receiptCost + opts.paidHours * opts.wage;
  return { partsSell, sold, cost, gp: sold - cost };
}
