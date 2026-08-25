export type Role = "admin" | "manager" | "technician";
export type AccountStatus = "active" | "pending" | "disabled";
export type CodeBookKind = "invoice" | "plumbing" | "hvac";
export type ThemeId = "stock" | "field" | "night" | "light";
export type LayoutMode = "auto" | "desktop" | "mobile";
export type NavId =
  | "board"
  | "field"
  | "jobs"
  | "timecards"
  | "exceptions"
  | "payroll"
  | "efficiency"
  | "codes"
  | "parts"
  | "truck"
  | "people"
  | "schedules"
  | "reports"
  | "audit"
  | "settings";

export type GpsStatus =
  | "OFF_SITE"
  | "APPROACHING"
  | "ON_SITE"
  | "WORKING"
  | "LEFT_SITE"
  | "OFFLINE";

export type TimeKind = "work" | "break" | "travel" | "admin" | "non_billable";

export type ExceptionKind =
  | "under_billed"
  | "over_billed"
  | "missing_code"
  | "invalid_code"
  | "payroll"
  | "left_site"
  | "gps_mismatch"
  | "late"
  | "early"
  | "overtime"
  | "note";

export type Employee = {
  id: string;
  companyId: string;
  userId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  laborClassification: string;
  payType: string;
  phone: string | null;
  vehicle: string | null;
  active: boolean;
  accountStatus: AccountStatus;
  hourlyWage: number;
};

export type CompanySettings = {
  gpsRadiusFt: number;
  gpsIntervalSec: number;
  gpsGraceMin: number;
  gpsAccuracyThresholdM: number;
  approachingMultiplier: number;
  exceptionToleranceMin: number;
  overtimeDailyHours: number;
  overtimeWeeklyHours: number;
  overtimeMultiplier: number;
  doubleTimeEnabled: boolean;
  travelCountsAsField: boolean;
  efficiencyAvailableSource: "schedule" | "clock";
  trackingOnlyDuringWork: boolean;
  laborRate: number;
  partsMarkup: number;
  locationRetentionDays: number;
  timezone: string;
  companyName: string;
  legalName: string;
  companyId: string;
  adminEmails: string[];
  adminHintVisible: boolean;
  themeId: ThemeId;
  layoutMode: LayoutMode;
  dispatchShowMap: boolean;
  dispatchShowTiles: boolean;
  signupOpen: boolean;
  signupRequiresApproval: boolean;
  mobileDock: NavId[];
  roleNav: Partial<Record<Role, NavId[]>>;
};

export type SessionProfile = {
  userId: string;
  email: string | null;
  displayName: string | null;
  employee: Employee;
  settings: CompanySettings;
};

export type TicketSummary = {
  id: string;
  ticketNumber: string;
  customerName: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  gpsRadiusFt: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  technicianId: string | null;
  technicianName: string | null;
  invoiceNumber: string | null;
  invoiceAmount: number;
  laborAmount: number;
  partsAmount: number;
  status: string;
  workDetail: string | null;
  notes: string | null;
  codes: { code: string; hoursExpected: number; laborValue: number }[];
  expectedHours: number;
};

export type LiveTechRow = {
  employee: Employee;
  gpsStatus: GpsStatus;
  ticket: TicketSummary | null;
  arrival: string | null;
  durationMin: number;
  billableHours: number;
  nonBillableHours: number;
  expectedHours: number;
  distanceFt: number | null;
  lastGpsAt: string | null;
  lastLat: number | null;
  lastLng: number | null;
  openExceptions: number;
  efficiency: number | null;
  clockedIn: boolean;
};

export type TimeEntryView = {
  id: string;
  employeeId: string;
  ticketId: string | null;
  ticketNumber: string | null;
  kind: TimeKind;
  clockIn: string;
  clockOut: string | null;
  billableMinutes: number;
  nonBillableMinutes: number;
  gpsStatus: string | null;
  clockInDistanceFt: number | null;
  notes: string | null;
  adjusted: boolean;
  adjustmentReason: string | null;
  approvalStatus: string;
  originalClockIn: string | null;
  originalClockOut: string | null;
};

export type ExceptionView = {
  id: string;
  employeeId: string;
  employeeName: string;
  ticketId: string | null;
  ticketNumber: string | null;
  kind: ExceptionKind;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
};

export type CodeBookEntry = {
  id: string;
  code: string;
  description: string;
  category: string;
  trade: string;
  book: CodeBookKind;
  hours: number;
  partsAllowance: number;
  laborValue: number;
  typicalDurationMin: number;
  active: boolean;
  notes: string | null;
};

export type CodeImportRow = {
  book?: string;
  code: string;
  description?: string;
  category?: string;
  trade?: string;
  hours?: number | string;
  parts_allowance?: number | string;
  partsAllowance?: number | string;
  list_price?: number | string;
  labor_value?: number | string;
  laborValue?: number | string;
  active?: boolean | string;
  notes?: string;
};

export type PartView = {
  id: string;
  partNumber: string;
  manufacturer: string;
  description: string;
  category: string;
  subcategory: string;
  cost: number;
  sellPrice: number;
  markup: number;
  vendor: string | null;
  stockQty: number;
  warehouseQty: number;
  keywords: string | null;
  aliases: string | null;
  active: boolean;
};

export type TruckItem = {
  id: string;
  part: PartView;
  vehicle: string;
  quantity: number;
  minQuantity: number;
  needsReplenish: boolean;
};

export type PayrollRow = {
  employee: Employee;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  grossRegular: number;
  grossOvertime: number;
  totalWages: number;
  billableHours: number;
  nonBillableHours: number;
  adminHours: number;
  travelHours: number;
  laborRevenue: number;
  partsRevenue: number;
  totalRevenue: number;
  revenuePerLaborHour: number;
  laborCostPct: number;
  contributionAfterLabor: number;
};

export type EfficiencyRow = {
  employee: Employee;
  availableHours: number;
  actualWorkedHours: number;
  billableHours: number;
  nonBillableHours: number;
  adminHours: number;
  travelHours: number;
  fieldHours: number;
  billableEfficiency: number;
  fieldUtilization: number;
  laborRevenue: number;
  partsRevenue: number;
  totalRevenue: number;
  revenuePerBillableHour: number;
  revenuePerFieldHour: number;
  grossContribution: number;
};

export type AuditView = {
  id: string;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  originalValue: string | null;
  newValue: string | null;
  reason: string | null;
  ticketId: string | null;
  createdAt: string;
};

export type DayHours = {
  billable: number;
  nonBillable: number;
  admin: number;
  travel: number;
  breakMin: number;
  worked: number;
};
