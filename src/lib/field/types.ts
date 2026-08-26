export type Role = "admin" | "manager" | "technician";
export type AccountStatus = "active" | "pending" | "disabled";
export type JobKind = "service" | "callback" | "warranty";
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
  | "AT_OFFICE"
  | "OFFLINE";

export type TimeKind = "work" | "show" | "travel" | "office" | "break" | "admin" | "non_billable";
export type PaidKind = "work" | "show" | "travel" | "office";

export type PayCondition = {
  requireGps: boolean;
  flagOnFail: boolean;
  requireApproval: boolean;
};
export type PayConditions = Record<PaidKind, PayCondition>;


export type ExceptionKind =
  | "under_billed"
  | "over_billed"
  | "missing_code"
  | "invalid_code"
  | "missing_time"
  | "unpaid_claim"
  | "payroll"
  | "left_site"
  | "gps_mismatch"
  | "office_mismatch"
  | "travel_mismatch"
  | "parts_over_allowance"
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
  username?: string | null;
};

export type CompanySettings = {
  gpsRadiusFt: number;
  gpsIntervalSec: number;
  gpsGraceMin: number;
  gpsConfirmMin: number;
  gpsFailFlagsWork: boolean;
  paySoldHours: boolean;
  efficiencyAlertPct: number;
  payConditions: PayConditions;
  weeklyEmailTo: string;
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
  officeName: string;
  officeAddress: string;
  officeCity: string;
  officeState: string;
  officeZip: string;
  officeLat: number;
  officeLng: number;
  officeRadiusFt: number;
  paidKinds: PaidKind[];
  requireGpsForPay: boolean;
  payrollFedPct: number;
  payrollStatePct: number;
  payrollFicaPct: number;
  officeSyncUrl: string;
  officeSyncKey: string;
  trialDays: number;
  trialStartedAt: string;
  trialUnlocked: boolean;
  trialUnlockedAt: string | null;
  demoLocked?: boolean;
};

export type TrialStatus = {
  enforced: boolean;
  unlocked: boolean;
  startedAt: string;
  endsAt: string;
  trialDays: number;
  daysLeft: number;
  locked: boolean;
};

export type SessionProfile = {
  userId: string;
  email: string | null;
  displayName: string | null;
  employee: Employee;
  settings: CompanySettings;
  trial: TrialStatus;
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
  jobKind: JobKind;
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
  paidMinutes: number;
  unpaidMinutes: number;
  gpsBacked: boolean;
  gpsStatus: string | null;
  clockInDistanceFt: number | null;
  notes: string | null;
  adjusted: boolean;
  adjustmentReason: string | null;
  approvalStatus: string;
  originalClockIn: string | null;
  originalClockOut: string | null;
  gpsConfirmStatus: string | null;
  gpsConfirmUntil: string | null;
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
  paidHours: number;
  unpaidHours: number;
  travelHours: number;
  showHours: number;
  workHours: number;
  officeHours: number;
  grossRegular: number;
  grossOvertime: number;
  totalWages: number;
  taxFed: number;
  taxState: number;
  taxFica: number;
  netPay: number;
  billableHours: number;
  nonBillableHours: number;
  adminHours: number;
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
  soldHours: number;
  jobHours: number;
  driveHours: number;
  officeHours: number;
  paidHours: number;
  unpaidHours: number;
  billableHours: number;
  nonBillableHours: number;
  adminHours: number;
  travelHours: number;
  fieldHours: number;
  billableEfficiency: number;
  jobEfficiency: number;
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
  show: number;
  office: number;
  breakMin: number;
  worked: number;
  paid: number;
  unpaid: number;
};

export type JobReceipt = {
  id: string;
  ticketId: string;
  employeeId: string;
  code: string | null;
  amount: number;
  vendor: string | null;
  notes: string | null;
  createdAt: string;
};

export type ClaimResult = {
  paid: boolean;
  gpsBacked: boolean;
  reason: string | null;
};
