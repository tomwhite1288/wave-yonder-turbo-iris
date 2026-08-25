import type {
  CompanySettings,
  DayHours,
  EfficiencyRow,
  Employee,
  PayrollRow,
  TimeKind,
} from "./types";

export function minutesBetween(startIso: string, endIso: string | null, now = new Date()): number {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : now.getTime();
  return Math.max(0, (end - start) / 60000);
}

export function classifyMinutes(
  kind: TimeKind,
  totalMin: number,
  billableMin: number,
): { billable: number; nonBillable: number; admin: number; travel: number; breakMin: number } {
  if (kind === "admin") return { billable: 0, nonBillable: 0, admin: totalMin, travel: 0, breakMin: 0 };
  if (kind === "travel") return { billable: 0, nonBillable: 0, admin: 0, travel: totalMin, breakMin: 0 };
  if (kind === "break") return { billable: 0, nonBillable: 0, admin: 0, travel: 0, breakMin: totalMin };
  if (kind === "non_billable") {
    return { billable: 0, nonBillable: totalMin, admin: 0, travel: 0, breakMin: 0 };
  }
  const billable = Math.min(totalMin, Math.max(0, billableMin || totalMin));
  return {
    billable,
    nonBillable: Math.max(0, totalMin - billable),
    admin: 0,
    travel: 0,
    breakMin: 0,
  };
}

export function emptyDayHours(): DayHours {
  return { billable: 0, nonBillable: 0, admin: 0, travel: 0, breakMin: 0, worked: 0 };
}

export function addDayHours(acc: DayHours, add: DayHours): DayHours {
  return {
    billable: acc.billable + add.billable,
    nonBillable: acc.nonBillable + add.nonBillable,
    admin: acc.admin + add.admin,
    travel: acc.travel + add.travel,
    breakMin: acc.breakMin + add.breakMin,
    worked: acc.worked + add.worked,
  };
}

export function splitOvertime(
  workedHours: number,
  settings: CompanySettings,
): { regular: number; overtime: number; doubleTime: number } {
  const daily = settings.overtimeDailyHours;
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
  const workedHours = opts.hours.worked / 60;
  const split = splitOvertime(workedHours, opts.settings);
  const wage = opts.employee.hourlyWage;
  const grossRegular = split.regular * wage;
  const grossOvertime =
    split.overtime * wage * opts.settings.overtimeMultiplier + split.doubleTime * wage * 2;
  const totalWages = grossRegular + grossOvertime;
  const totalRevenue = opts.laborRevenue + opts.partsRevenue;
  const billableHours = opts.hours.billable / 60;
  const laborHours = Math.max(workedHours, 0.0001);
  return {
    employee: opts.employee,
    regularHours: split.regular,
    overtimeHours: split.overtime,
    doubleTimeHours: split.doubleTime,
    grossRegular,
    grossOvertime,
    totalWages,
    billableHours,
    nonBillableHours: opts.hours.nonBillable / 60,
    adminHours: opts.hours.admin / 60,
    travelHours: opts.hours.travel / 60,
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
  settings: CompanySettings;
  laborRevenue: number;
  partsRevenue: number;
}): EfficiencyRow {
  const billableHours = opts.hours.billable / 60;
  const fieldHours =
    (opts.hours.billable +
      opts.hours.nonBillable +
      (opts.settings.travelCountsAsField ? opts.hours.travel : 0)) /
    60;
  const actualWorked = opts.hours.worked / 60;
  const available = Math.max(opts.availableHours, 0);
  const totalRevenue = opts.laborRevenue + opts.partsRevenue;
  return {
    employee: opts.employee,
    availableHours: available,
    actualWorkedHours: actualWorked,
    billableHours,
    nonBillableHours: opts.hours.nonBillable / 60,
    adminHours: opts.hours.admin / 60,
    travelHours: opts.hours.travel / 60,
    fieldHours,
    billableEfficiency: available > 0 ? billableHours / available : 0,
    fieldUtilization: fieldHours > 0 ? billableHours / fieldHours : 0,
    laborRevenue: opts.laborRevenue,
    partsRevenue: opts.partsRevenue,
    totalRevenue,
    revenuePerBillableHour: billableHours > 0 ? totalRevenue / billableHours : 0,
    revenuePerFieldHour: fieldHours > 0 ? totalRevenue / fieldHours : 0,
    grossContribution: totalRevenue - actualWorked * opts.employee.hourlyWage,
  };
}

export function discrepancyKind(
  actualBillableHours: number,
  expectedHours: number,
  toleranceMin: number,
  hasCodes: boolean,
): "under_billed" | "over_billed" | "missing_code" | null {
  if (actualBillableHours > 0.05 && !hasCodes) return "missing_code";
  const deltaMin = (actualBillableHours - expectedHours) * 60;
  if (deltaMin > toleranceMin) return "under_billed";
  if (deltaMin < -toleranceMin && expectedHours > 0) return "over_billed";
  return null;
}
