"use client";

import {
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCheck,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";

type Role = "Tenant Admin" | "HR Admin" | "Manager" | "Employee";
type ModuleKey =
  | "dashboard"
  | "organization"
  | "employees"
  | "leave"
  | "attendance"
  | "approvals"
  | "reports";
type PopupTone = "success" | "error" | "warning";
type OverlayState = "none" | "unauthorized" | "error";

type EmployeeRecord = {
  id: string;
  recordId?: string;
  name: string;
  team: string;
  title: string;
  status: string;
  email: string;
  manager: string;
  employmentStatus?: string;
  workLocation?: string;
};

type LeaveRequest = {
  approvalRemarks?: string | null;
  id: string;
  employeeId: string;
  employee: string;
  leaveType: string;
  dates: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
};

type AttendanceItem = {
  id: string;
  attendanceDate?: string;
  employeeCode?: string;
  employeeId?: string;
  employee: string;
  remarks?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  time: string;
  timeIn?: string | null;
  timeOut?: string | null;
  status: string;
};

type ProfileSummary = {
  department: string;
  directReportsCount: number;
  email: string;
  employeeCode: string;
  fullName: string;
  jobTitle: string;
  managerName: string | null;
  profileStatus: string;
  workLocation: string;
};

type TenantProfileRecord = {
  active: boolean;
  code: string;
  contactEmail: string;
  name: string;
};

type DepartmentRecord = {
  active: boolean;
  code: string;
  description: string;
  employeeCount: number;
  id: string;
  managerEmployeeId: string | null;
  managerName: string;
  name: string;
};

type AdminUserRecord = {
  active: boolean;
  department: string;
  email: string;
  employeeCode: string;
  employeeId: string | null;
  employeeName: string;
  id: string;
  jobTitle: string;
  lastLoginAt: string | null;
};

type EmployeeOption = {
  department?: string;
  employeeCode: string;
  fullName: string;
  id: string;
  jobTitle: string;
  linkedAdminActive?: boolean | null;
  linkedAdminUserId?: string | null;
};

type LeaveBalanceItem = {
  entitlement: number;
  leaveType: string;
  openingBalance: number;
  pendingBalance: number;
  remainingBalance: number;
  usedBalance: number;
};

type LeavePolicyRecord = {
  code: string;
  enabled: boolean;
  entitlement: number;
  id: string;
  name: string;
  openingBalance: number;
};

type DashboardSummary = {
  approvedLeaveCount: number;
  attendanceIssueCount: number;
  attendanceRecordCount: number;
  auditCount: number;
  departmentCount: number;
  hrAdminCount: number;
  pendingApprovalCount: number;
  roleLabel: string;
  scopeLabel: string;
  visibleEmployeeCount: number;
  visibleLeaveCount: number;
};

type ReportMetric = {
  label: string;
  note: string;
  value: string;
};

type ReportSection = {
  id: string;
  metrics: ReportMetric[];
  subtitle: string;
  title: string;
};

type AuditEntry = {
  actionType: string;
  actor: string;
  createdAt: string;
  description: string;
  id: string;
  module: string;
  targetRecordId: string;
};

type PortalSession = {
  email: string;
  employee: string;
  employeeId: string | null;
  role: Role;
  tenantCode: string;
};

type PopupState = {
  tone: PopupTone;
  title: string;
  message: string;
  debugRef: string;
} | null;

type EmployeeFormState = {
  id: string;
  employmentStatus: string;
  workLocation: string;
  name: string;
  team: string;
  title: string;
  email: string;
  manager: string;
  status: string;
};

type LeaveFormState = {
  employeeId: string;
  employee: string;
  leaveType: string;
  dates: string;
  reason: string;
};

type LeavePolicyFormState = {
  code: string;
  enabled: string;
  entitlement: string;
  name: string;
  openingBalance: string;
};

type TenantFormState = {
  active: string;
  contactEmail: string;
  name: string;
};

type DepartmentFormState = {
  active: string;
  code: string;
  description: string;
  managerEmployeeId: string;
  name: string;
};

type AdminUserFormState = {
  active: string;
  employeeId: string;
  password: string;
};

type AttendanceReviewFormState = {
  remarks: string;
  reviewedAt: string;
  status: string;
  timeIn: string;
  timeOut: string;
};

type ApprovalDecisionFormState = {
  remarks: string;
  status: "Approved" | "Rejected";
};

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "organization", label: "Organization", icon: Building2 },
  { key: "employees", label: "Employees", icon: UsersRound },
  { key: "leave", label: "Leave", icon: CalendarClock },
  { key: "attendance", label: "Attendance", icon: Clock3 },
  { key: "approvals", label: "Approvals", icon: CheckCheck },
  { key: "reports", label: "Reports", icon: FileSpreadsheet },
] satisfies Array<{ key: ModuleKey; label: string; icon: typeof LayoutDashboard }>;

const TENANT_STORAGE_KEY = "corevision.hrms.tenantProfile";
const DEPARTMENT_STORAGE_KEY = "corevision.hrms.departments";
const ADMIN_STORAGE_KEY = "corevision.hrms.adminUsers";
const EMPLOYEE_STORAGE_KEY = "corevision.hrms.employees";
const LEAVE_POLICY_STORAGE_KEY = "corevision.hrms.leavePolicies";
const LEAVE_STORAGE_KEY = "corevision.hrms.leaveRequests";
const ATTENDANCE_STORAGE_KEY = "corevision.hrms.attendanceItems";

const allowedModulesByRole: Record<Role, ModuleKey[]> = {
  "Tenant Admin": ["dashboard", "organization", "employees", "reports"],
  "HR Admin": ["dashboard", "organization", "employees", "leave", "attendance", "approvals", "reports"],
  Manager: ["dashboard", "employees", "leave", "attendance", "approvals", "reports"],
  Employee: ["dashboard", "leave", "attendance"],
};

const roleUsers: Record<Role, { employeeId: string; employee: string }> = {
  "Tenant Admin": { employeeId: "EMP-9000", employee: "Tenant Admin" },
  "HR Admin": { employeeId: "EMP-1001", employee: "Alya Rahman" },
  Manager: { employeeId: "EMP-1021", employee: "Daniel Tan" },
  Employee: { employeeId: "EMP-1098", employee: "Marcus Lee" },
};

const initialEmployeeRecords: EmployeeRecord[] = [
  {
    id: "EMP-1001",
    recordId: "EMP-1001",
    name: "Alya Rahman",
    team: "People Ops",
    title: "HR Executive",
    status: "Active",
    email: "alya.rahman@corevision.local",
    manager: "Daniel Tan",
    employmentStatus: "Permanent",
    workLocation: "Kuala Lumpur",
  },
  {
    id: "EMP-1021",
    recordId: "EMP-1021",
    name: "Daniel Tan",
    team: "Engineering",
    title: "Team Lead",
    status: "Active",
    email: "daniel.tan@corevision.local",
    manager: "Tenant Admin",
    employmentStatus: "Permanent",
    workLocation: "Kuala Lumpur",
  },
  {
    id: "EMP-1084",
    recordId: "EMP-1084",
    name: "Nur Imani",
    team: "Finance",
    title: "Payroll Analyst",
    status: "Pending Setup",
    email: "nur.imani@corevision.local",
    manager: "Alya Rahman",
    employmentStatus: "Permanent",
    workLocation: "Kuala Lumpur",
  },
  {
    id: "EMP-1098",
    recordId: "EMP-1098",
    name: "Marcus Lee",
    team: "Operations",
    title: "Admin Officer",
    status: "Needs Review",
    email: "marcus.lee@corevision.local",
    manager: "Alya Rahman",
    employmentStatus: "Contract",
    workLocation: "Shah Alam",
  },
];

const initialLeaveRequests: LeaveRequest[] = [
  {
    approvalRemarks: null,
    id: "LV-2301",
    employeeId: "EMP-1001",
    employee: "Alya Rahman",
    leaveType: "Annual Leave",
    dates: "21 Apr - 22 Apr",
    reason: "Family travel",
    status: "Pending",
  },
  {
    approvalRemarks: "Medical certificate accepted.",
    id: "LV-2302",
    employeeId: "EMP-1098",
    employee: "Marcus Lee",
    leaveType: "Medical Leave",
    dates: "18 Apr",
    reason: "Clinic visit",
    status: "Approved",
  },
  {
    approvalRemarks: "Emergency documentation missing for approval.",
    id: "LV-2303",
    employeeId: "EMP-1084",
    employee: "Nur Imani",
    leaveType: "Emergency Leave",
    dates: "24 Apr",
    reason: "Family emergency",
    status: "Rejected",
  },
];

const initialLeavePolicies: LeavePolicyRecord[] = [
  {
    code: "ANNUAL",
    enabled: true,
    entitlement: 12,
    id: "LEAVE-ANNUAL",
    name: "Annual Leave",
    openingBalance: 2,
  },
  {
    code: "MEDICAL",
    enabled: true,
    entitlement: 14,
    id: "LEAVE-MEDICAL",
    name: "Medical Leave",
    openingBalance: 0,
  },
  {
    code: "EMERGENCY",
    enabled: true,
    entitlement: 3,
    id: "LEAVE-EMERGENCY",
    name: "Emergency Leave",
    openingBalance: 0,
  },
];

const attendanceItems: AttendanceItem[] = [
  {
    id: "AT-4001",
    attendanceDate: "2026-04-16T00:00:00.000Z",
    employeeCode: "EMP-1021",
    employeeId: "EMP-1021",
    employee: "Daniel Tan",
    remarks: "Missing clock-out needs follow-up.",
    reviewedAt: null,
    reviewedBy: null,
    time: "08:52 - Open",
    timeIn: "2026-04-16T08:52:00.000Z",
    timeOut: null,
    status: "Missing Clock Out",
  },
  {
    id: "AT-4002",
    attendanceDate: "2026-04-16T00:00:00.000Z",
    employeeCode: "EMP-1001",
    employeeId: "EMP-1001",
    employee: "Alya Rahman",
    remarks: "Completed shift.",
    reviewedAt: "2026-04-16T18:00:00.000Z",
    reviewedBy: "hr.audit@corevision.local",
    time: "08:14 - 17:46",
    timeIn: "2026-04-16T08:14:00.000Z",
    timeOut: "2026-04-16T17:46:00.000Z",
    status: "Complete",
  },
  {
    id: "AT-4003",
    attendanceDate: "2026-04-16T00:00:00.000Z",
    employeeCode: "EMP-1098",
    employeeId: "EMP-1098",
    employee: "Marcus Lee",
    remarks: "Late check-in flagged for review.",
    reviewedAt: null,
    reviewedBy: null,
    time: "09:31 - Open",
    timeIn: "2026-04-16T09:31:00.000Z",
    timeOut: null,
    status: "Late Check In",
  },
];

const initialTenantProfile: TenantProfileRecord = {
  active: true,
  code: "COREVISION",
  contactEmail: "ops@corevision.local",
  name: "Core Vision",
};

const initialDepartments: DepartmentRecord[] = [
  {
    active: true,
    code: "ENG",
    description: "Product engineering and platform delivery.",
    employeeCount: 1,
    id: "DEPT-ENG",
    managerEmployeeId: "EMP-1021",
    managerName: "Daniel Tan",
    name: "Engineering",
  },
  {
    active: true,
    code: "POPS",
    description: "HR operations and employee policy administration.",
    employeeCount: 1,
    id: "DEPT-POPS",
    managerEmployeeId: "EMP-1001",
    managerName: "Alya Rahman",
    name: "People Ops",
  },
  {
    active: true,
    code: "OPS",
    description: "Operational support and shared services.",
    employeeCount: 1,
    id: "DEPT-OPS",
    managerEmployeeId: "EMP-1098",
    managerName: "Marcus Lee",
    name: "Operations",
  },
  {
    active: true,
    code: "FIN",
    description: "Finance operations and reporting support.",
    employeeCount: 1,
    id: "DEPT-FIN",
    managerEmployeeId: "EMP-1084",
    managerName: "Nur Imani",
    name: "Finance",
  },
];

const initialAdminUsers: AdminUserRecord[] = [
  {
    active: true,
    department: "People Ops",
    email: "alya.rahman@corevision.local",
    employeeCode: "EMP-1001",
    employeeId: "EMP-1001",
    employeeName: "Alya Rahman",
    id: "USR-HR-1001",
    jobTitle: "HR Executive",
    lastLoginAt: null,
  },
];

const roleDescriptions: Record<Role, string> = {
  "Tenant Admin": "Manage tenant structure, admins, and high-level workspace settings.",
  "HR Admin": "Run employee operations, leave oversight, attendance review, and reports.",
  Manager: "See direct reports, approve team requests, and monitor attendance issues while keeping self-service access.",
  Employee: "Use self-service for profile, leave, and attendance actions.",
};

const popupStyles: Record<PopupTone, { ring: string; badge: string; icon: typeof CheckCheck }> = {
  success: { ring: "ring-emerald-200", badge: "bg-emerald-100 text-emerald-700", icon: CheckCheck },
  error: { ring: "ring-rose-200", badge: "bg-rose-100 text-rose-700", icon: CircleAlert },
  warning: { ring: "ring-amber-200", badge: "bg-amber-100 text-amber-700", icon: BellRing },
};

const defaultEmployeeForm: EmployeeFormState = {
  id: "",
  employmentStatus: "Permanent",
  workLocation: "Kuala Lumpur",
  name: "",
  team: "",
  title: "",
  email: "",
  manager: "",
  status: "ACTIVE",
};

const defaultTenantForm: TenantFormState = {
  active: "true",
  contactEmail: "",
  name: "",
};

const defaultDepartmentForm: DepartmentFormState = {
  active: "true",
  code: "",
  description: "",
  managerEmployeeId: "",
  name: "",
};

const defaultAdminUserForm: AdminUserFormState = {
  active: "true",
  employeeId: "",
  password: "",
};

const defaultAttendanceReviewForm: AttendanceReviewFormState = {
  remarks: "",
  reviewedAt: "",
  status: "COMPLETE",
  timeIn: "",
  timeOut: "",
};

const defaultLeavePolicyForm: LeavePolicyFormState = {
  code: "",
  enabled: "true",
  entitlement: "0",
  name: "",
  openingBalance: "0",
};

const defaultApprovalDecisionForm: ApprovalDecisionFormState = {
  remarks: "",
  status: "Approved",
};

function defaultLeaveFormForRole(role: Role): LeaveFormState {
  return {
    employeeId: roleUsers[role].employeeId,
    employee: roleUsers[role].employee,
    leaveType: "Annual Leave",
    dates: "",
    reason: "",
  };
}

function getFirstEnabledLeaveType(leavePolicies: LeavePolicyRecord[]) {
  return leavePolicies.find((policy) => policy.enabled)?.name ?? "Annual Leave";
}

function mapBackendLeavePolicy(policy: {
  code: string;
  enabled: boolean;
  entitlement: number;
  id: string;
  name: string;
  openingBalance: number;
}): LeavePolicyRecord {
  return {
    code: policy.code,
    enabled: policy.enabled,
    entitlement: policy.entitlement,
    id: policy.id,
    name: policy.name,
    openingBalance: policy.openingBalance,
  };
}

function estimateLeaveDays(dateRange: string) {
  if (!dateRange.includes("-")) {
    return 1;
  }

  const normalized = dateRange
    .split(/\s+-\s+|\s+to\s+/i)
    .map((value) => value.trim())
    .filter(Boolean);

  return normalized.length >= 2 ? 2 : 1;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function readLocalState<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);

    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function readJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & { title?: string; message?: string; debugRef?: string })
    | null;

  if (!response.ok) {
    const error = new Error(payload?.message ?? "Request failed.");
    (error as Error & { debugRef?: string; title?: string }).debugRef = payload?.debugRef;
    (error as Error & { debugRef?: string; title?: string }).title = payload?.title;
    throw error;
  }

  return payload as T;
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
  });
  const start = formatter.format(new Date(startDate));
  const end = formatter.format(new Date(endDate));

  return start === end ? start : `${start} - ${end}`;
}

function parseDateRangeInput(value: string) {
  const normalized = value.trim();
  const match = normalized.match(
    /^(\d{4}-\d{2}-\d{2})(?:\s*(?:to|-)\s*(\d{4}-\d{2}-\d{2}))?$/i,
  );

  if (!match) {
    return null;
  }

  const startDate = `${match[1]}T00:00:00.000Z`;
  const endDate = `${match[2] ?? match[1]}T00:00:00.000Z`;
  const dayInMs = 24 * 60 * 60 * 1000;
  const totalDays =
    Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / dayInMs) + 1;

  return {
    endDate,
    startDate,
    totalDays,
  };
}

function formatAttendanceClock(value?: string | null) {
  if (!value) {
    return "Open";
  }

  return new Intl.DateTimeFormat("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatAttendanceWindow(timeIn?: string | null, timeOut?: string | null) {
  return `${formatAttendanceClock(timeIn)} - ${formatAttendanceClock(timeOut)}`;
}

function formatDateTimeInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}

function normalizeDateTimeInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function toAttendanceStatusValue(value: string) {
  return value.toUpperCase().replaceAll(" ", "_");
}

function fromAttendanceStatusValue(value: string) {
  return value.replaceAll("_", " ");
}

function buildAttendanceDateIso() {
  const now = new Date();

  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
}

function isSameCalendarDate(value: string | undefined, compareTo: string) {
  return value ? value.slice(0, 10) === compareTo.slice(0, 10) : false;
}

function mapBackendEmployee(employee: {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  employmentStatus?: string;
  jobTitle: string;
  profileStatus: string;
  email: string;
  workLocation?: string | null;
  manager?: { fullName: string } | null;
}): EmployeeRecord {
  return {
    id: employee.employeeCode,
    recordId: employee.id,
    manager: employee.manager?.fullName ?? "Assigned manager pending",
    name: employee.fullName,
    email: employee.email,
    status: employee.profileStatus,
    team: employee.department,
    title: employee.jobTitle,
    employmentStatus: employee.employmentStatus,
    workLocation: employee.workLocation ?? undefined,
  };
}

function mapBackendLeaveRequest(request: {
  approvalRemarks?: string | null;
  id: string;
  employeeId: string;
  employee: { fullName: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}): LeaveRequest {
  return {
    approvalRemarks: request.approvalRemarks ?? null,
    id: request.id,
    dates: formatDateRange(request.startDate, request.endDate),
    employee: request.employee.fullName,
    employeeId: request.employeeId,
    leaveType: request.leaveType,
    reason: request.reason,
    status:
      request.status === "PENDING"
        ? "Pending"
        : request.status === "APPROVED"
          ? "Approved"
          : "Rejected",
  };
}

function mapBackendAttendanceItem(record: {
  id: string;
  attendanceDate: string;
  employeeId?: string;
  employee: { fullName: string; employeeCode?: string };
  remarks?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: { email: string } | null;
  timeIn?: string | null;
  timeOut?: string | null;
  status: string;
}): AttendanceItem {
  return {
    attendanceDate: record.attendanceDate,
    employeeCode: record.employee.employeeCode,
    employeeId: record.employeeId,
    id: record.id,
    employee: record.employee.fullName,
    remarks: record.remarks ?? null,
    reviewedAt: record.reviewedAt ?? null,
    reviewedBy: record.reviewedBy?.email ?? null,
    timeIn: record.timeIn,
    timeOut: record.timeOut,
    status: fromAttendanceStatusValue(record.status),
    time: formatAttendanceWindow(record.timeIn, record.timeOut),
  };
}

function mapBackendDepartmentItem(item: {
  active: boolean;
  code: string;
  description?: string | null;
  employeeCount?: number;
  id: string;
  managerEmployeeId?: string | null;
  managerEmployee?: { fullName: string } | null;
  name: string;
}): DepartmentRecord {
  return {
    active: item.active,
    code: item.code,
    description: item.description ?? "",
    employeeCount: item.employeeCount ?? 0,
    id: item.id,
    managerEmployeeId: item.managerEmployeeId ?? null,
    managerName: item.managerEmployee?.fullName ?? "Lead not assigned",
    name: item.name,
  };
}

function mapBackendAdminUser(item: {
  active: boolean;
  email: string;
  employeeId?: string | null;
  employee?: {
    department: string;
    employeeCode: string;
    fullName: string;
    jobTitle: string;
  } | null;
  id: string;
  lastLoginAt?: string | null;
}): AdminUserRecord {
  return {
    active: item.active,
    department: item.employee?.department ?? "Unassigned",
    email: item.email,
    employeeCode: item.employee?.employeeCode ?? "N/A",
    employeeId: item.employeeId ?? null,
    employeeName: item.employee?.fullName ?? "Employee link pending",
    id: item.id,
    jobTitle: item.employee?.jobTitle ?? "Unassigned",
    lastLoginAt: item.lastLoginAt ?? null,
  };
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "No login recorded";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value?: string | null) {
  if (!value) {
    return "No date recorded";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function HrmsPortal({ session }: { session?: PortalSession | null }) {
  const [role, setRole] = useState<Role>(session?.role ?? "HR Admin");
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");
  const [popup, setPopup] = useState<PopupState>(null);
  const [search, setSearch] = useState("");
  const [overlayState, setOverlayState] = useState<OverlayState>("none");
  const [tenantProfile, setTenantProfile] = useState<TenantProfileRecord>(initialTenantProfile);
  const [departments, setDepartments] = useState<DepartmentRecord[]>(initialDepartments);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(initialAdminUsers);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeRecord[]>(initialEmployeeRecords);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicyRecord[]>(initialLeavePolicies);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceItem[]>(attendanceItems);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [managerOptions, setManagerOptions] = useState<EmployeeOption[]>([]);
  const [adminCandidates, setAdminCandidates] = useState<EmployeeOption[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isAdminUserModalOpen, setIsAdminUserModalOpen] = useState(false);
  const [isAttendanceReviewModalOpen, setIsAttendanceReviewModalOpen] = useState(false);
  const [isLeavePolicyModalOpen, setIsLeavePolicyModalOpen] = useState(false);
  const [isApprovalDecisionModalOpen, setIsApprovalDecisionModalOpen] = useState(false);
  const [editingEmployeeRecordId, setEditingEmployeeRecordId] = useState<string | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [editingLeavePolicyId, setEditingLeavePolicyId] = useState<string | null>(null);
  const [reviewingAttendanceId, setReviewingAttendanceId] = useState<string | null>(null);
  const [approvalDecisionRequestId, setApprovalDecisionRequestId] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(defaultEmployeeForm);
  const [leaveForm, setLeaveForm] = useState<LeaveFormState>(
    defaultLeaveFormForRole(session?.role ?? "HR Admin"),
  );
  const [tenantForm, setTenantForm] = useState<TenantFormState>(defaultTenantForm);
  const [departmentForm, setDepartmentForm] = useState<DepartmentFormState>(defaultDepartmentForm);
  const [adminUserForm, setAdminUserForm] = useState<AdminUserFormState>(defaultAdminUserForm);
  const [leavePolicyForm, setLeavePolicyForm] = useState<LeavePolicyFormState>(defaultLeavePolicyForm);
  const [attendanceReviewForm, setAttendanceReviewForm] = useState<AttendanceReviewFormState>(
    defaultAttendanceReviewForm,
  );
  const [approvalDecisionForm, setApprovalDecisionForm] = useState<ApprovalDecisionFormState>(
    defaultApprovalDecisionForm,
  );
  const [isAttendanceSubmitting, setIsAttendanceSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const isBackendMode = Boolean(session);
  const actor = session ?? roleUsers[role];
  const currentAttendanceDate = useMemo(() => buildAttendanceDateIso(), []);
  const actorName = session?.employee ?? roleUsers[role].employee;

  useEffect(() => {
    if (isBackendMode) {
      return;
    }

    setTenantProfile(readLocalState<TenantProfileRecord>(TENANT_STORAGE_KEY, initialTenantProfile));
    setDepartments(readLocalState<DepartmentRecord[]>(DEPARTMENT_STORAGE_KEY, initialDepartments));
    setAdminUsers(readLocalState<AdminUserRecord[]>(ADMIN_STORAGE_KEY, initialAdminUsers));
    setEmployeeRecords(readLocalState<EmployeeRecord[]>(EMPLOYEE_STORAGE_KEY, initialEmployeeRecords));
    setLeavePolicies(readLocalState<LeavePolicyRecord[]>(LEAVE_POLICY_STORAGE_KEY, initialLeavePolicies));
    setLeaveRequests(readLocalState<LeaveRequest[]>(LEAVE_STORAGE_KEY, initialLeaveRequests));
    setAttendanceRecords(readLocalState<AttendanceItem[]>(ATTENDANCE_STORAGE_KEY, attendanceItems));
  }, [isBackendMode]);

  useEffect(() => {
    if (!isBackendMode && typeof window !== "undefined") {
      window.localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenantProfile));
    }
  }, [isBackendMode, tenantProfile]);

  useEffect(() => {
    if (!isBackendMode && typeof window !== "undefined") {
      window.localStorage.setItem(DEPARTMENT_STORAGE_KEY, JSON.stringify(departments));
    }
  }, [departments, isBackendMode]);

  useEffect(() => {
    if (!isBackendMode && typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminUsers));
    }
  }, [adminUsers, isBackendMode]);

  useEffect(() => {
    if (!isBackendMode && typeof window !== "undefined") {
      window.localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(employeeRecords));
    }
  }, [employeeRecords, isBackendMode]);

  useEffect(() => {
    if (!isBackendMode && typeof window !== "undefined") {
      window.localStorage.setItem(LEAVE_POLICY_STORAGE_KEY, JSON.stringify(leavePolicies));
    }
  }, [isBackendMode, leavePolicies]);

  useEffect(() => {
    if (!isBackendMode && typeof window !== "undefined") {
      window.localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(leaveRequests));
    }
  }, [leaveRequests, isBackendMode]);

  useEffect(() => {
    if (!isBackendMode && typeof window !== "undefined") {
      window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendanceRecords));
    }
  }, [attendanceRecords, isBackendMode]);

  useEffect(() => {
    const defaultLeaveType = getFirstEnabledLeaveType(leavePolicies);

    if (session) {
      setRole(session.role);
      setLeaveForm({
        employee: session.employee,
        employeeId: session.employeeId ?? "",
        leaveType: defaultLeaveType,
        dates: "",
        reason: "",
      });
      return;
    }

    setLeaveForm({
      ...defaultLeaveFormForRole(role),
      leaveType: defaultLeaveType,
    });
  }, [leavePolicies, role, session]);

  useEffect(() => {
    setTenantForm({
      active: tenantProfile.active ? "true" : "false",
      contactEmail: tenantProfile.contactEmail,
      name: tenantProfile.name,
    });
  }, [tenantProfile]);

  useEffect(() => {
    if (!isBackendMode) {
      return;
    }

    let cancelled = false;

    const syncFromBackend = async () => {
      setIsSyncing(true);

      try {
        const [
          tenantPayload,
          departmentPayload,
          adminPayload,
          employeePayload,
          leavePolicyPayload,
          leavePayload,
          attendancePayload,
          profilePayload,
          leaveBalancePayload,
          dashboardPayload,
          reportsPayload,
          auditPayload,
        ] = await Promise.all([
          readJson<{
            item: {
              active: boolean;
              code: string;
              contactEmail?: string | null;
              name: string;
            };
          }>("/api/tenant-profile").catch(() => ({
            item: initialTenantProfile,
          })),
          readJson<{
            items: Array<{
              active: boolean;
              code: string;
              description?: string | null;
              employeeCount?: number;
              id: string;
              managerEmployeeId?: string | null;
              managerEmployee?: { fullName: string } | null;
              name: string;
            }>;
            managerCandidates: EmployeeOption[];
          }>("/api/departments").catch((error) => {
            if (role === "Manager" || role === "Employee") {
              return { items: [], managerCandidates: [] };
            }

            throw error;
          }),
          readJson<{
            items: Array<{
              active: boolean;
              email: string;
              employeeId?: string | null;
              employee?: {
                department: string;
                employeeCode: string;
                fullName: string;
                jobTitle: string;
              } | null;
              id: string;
              lastLoginAt?: string | null;
            }>;
            candidates: EmployeeOption[];
          }>("/api/admin-users").catch((error) => {
            if (role !== "Tenant Admin") {
              return { items: [], candidates: [] };
            }

            throw error;
          }),
          readJson<{
            items: Array<{
              id: string;
              employeeCode: string;
              fullName: string;
              department: string;
              employmentStatus?: string;
              jobTitle: string;
              profileStatus: string;
              email: string;
              workLocation?: string | null;
              manager?: { fullName: string } | null;
            }>;
          }>("/api/employees").catch((error) => {
            if (role === "Employee") {
              return { items: [] };
            }

            throw error;
          }),
          readJson<{
            items: Array<{
              code: string;
              enabled: boolean;
              entitlement: number;
              id: string;
              name: string;
              openingBalance: number;
            }>;
          }>("/api/leave-types"),
          readJson<{
            items: Array<{
              approvalRemarks?: string | null;
              id: string;
              employeeId: string;
              employee: { fullName: string };
              leaveType: string;
              startDate: string;
              endDate: string;
              reason: string;
              status: "PENDING" | "APPROVED" | "REJECTED";
            }>;
          }>("/api/leave-requests"),
          readJson<{
            items: Array<{
              id: string;
              attendanceDate: string;
              employeeId?: string;
              employee: { fullName: string; employeeCode?: string };
              remarks?: string | null;
              reviewedAt?: string | null;
              reviewedBy?: { email: string } | null;
              timeIn?: string | null;
              timeOut?: string | null;
              status: string;
            }>;
            }>("/api/attendance"),
          readJson<{
            item: ProfileSummary | null;
          }>("/api/me/profile").catch(() => ({ item: null })),
          readJson<{
            items: LeaveBalanceItem[];
          }>("/api/leave-balance").catch(() => ({ items: [] })),
          readJson<{
            item: DashboardSummary;
          }>("/api/dashboard"),
          readJson<{
            items: ReportSection[];
          }>("/api/reports"),
          readJson<{
            items: AuditEntry[];
          }>("/api/audit-log"),
        ]);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setTenantProfile({
            active: tenantPayload.item.active,
            code: tenantPayload.item.code,
            contactEmail: tenantPayload.item.contactEmail ?? "",
            name: tenantPayload.item.name,
          });
          setDepartments(departmentPayload.items.map(mapBackendDepartmentItem));
          setAdminUsers(adminPayload.items.map(mapBackendAdminUser));
          setEmployeeRecords(employeePayload.items.map(mapBackendEmployee));
          setLeavePolicies(leavePolicyPayload.items.map(mapBackendLeavePolicy));
          setLeaveRequests(leavePayload.items.map(mapBackendLeaveRequest));
          setAttendanceRecords(attendancePayload.items.map(mapBackendAttendanceItem));
          setProfileSummary(profilePayload.item);
          setLeaveBalances(leaveBalancePayload.items);
          setDashboardSummary(dashboardPayload.item);
          setReportSections(reportsPayload.items);
          setAuditEntries(auditPayload.items);
          setManagerOptions(departmentPayload.managerCandidates);
          setAdminCandidates(adminPayload.candidates);
        });
      } catch (error) {
        const fallbackError = error as Error & { debugRef?: string; title?: string };
        if (!cancelled) {
          showPopup(
            "error",
            fallbackError.title ?? "Backend sync failed",
            fallbackError.message,
            fallbackError.debugRef ?? "DEBUG-PREVIEW-SYNC-01",
          );
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    };

    void syncFromBackend();

    return () => {
      cancelled = true;
    };
  }, [isBackendMode, role]);

  const visibleModules = allowedModulesByRole[role];

  useEffect(() => {
    if (!visibleModules.includes(activeModule)) {
      setActiveModule(visibleModules[0]);
      setOverlayState("unauthorized");
    }
  }, [activeModule, visibleModules]);

  const scopedEmployeeRecords = useMemo(() => {
    if (role === "Manager") {
      return employeeRecords.filter((employee) => employee.manager === actorName);
    }

    if (role === "Employee") {
      return employeeRecords.filter((employee) => employee.id === actor.employeeId);
    }

    return employeeRecords;
  }, [actor.employeeId, actorName, employeeRecords, role]);

  const filteredEmployees = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    return scopedEmployeeRecords.filter((employee) => {
      if (!keyword) {
        return true;
      }

      return (
        employee.name.toLowerCase().includes(keyword) ||
        employee.id.toLowerCase().includes(keyword) ||
        employee.team.toLowerCase().includes(keyword)
      );
    });
  }, [deferredSearch, scopedEmployeeRecords]);

  const leaveRequestsForRole = useMemo(() => {
    if (role === "Employee") {
      return leaveRequests.filter((request) => request.employeeId === actor.employeeId);
    }

    if (role === "Manager") {
      const directReportIds = new Set(scopedEmployeeRecords.map((employee) => employee.id));

      return leaveRequests.filter(
        (request) =>
          request.employeeId === actor.employeeId || directReportIds.has(request.employeeId),
      );
    }

    return leaveRequests;
  }, [actor.employeeId, leaveRequests, role, scopedEmployeeRecords]);

  const directReportNames = useMemo(
    () => scopedEmployeeRecords.map((employee) => employee.name),
    [scopedEmployeeRecords],
  );

  const departmentManagerOptions = useMemo(() => {
    if (isBackendMode && managerOptions.length) {
      return managerOptions;
    }

    return employeeRecords.map((employee) => ({
      department: employee.team,
      employeeCode: employee.id,
      fullName: employee.name,
      id: employee.id,
      jobTitle: employee.title,
    }));
  }, [employeeRecords, isBackendMode, managerOptions]);

  const availableAdminCandidates = useMemo(() => {
    if (isBackendMode && (adminCandidates.length || role === "Tenant Admin")) {
      return adminCandidates;
    }

    const linkedAdminEmployeeIds = new Set(adminUsers.map((item) => item.employeeId).filter(Boolean));

    return employeeRecords
      .filter((employee) => !linkedAdminEmployeeIds.has(employee.id) || adminUsers.some((item) => item.employeeId === employee.id))
      .map((employee) => {
        const linkedAdmin = adminUsers.find((item) => item.employeeId === employee.id);

        return {
          department: employee.team,
          employeeCode: employee.id,
          fullName: employee.name,
          id: employee.id,
          jobTitle: employee.title,
          linkedAdminActive: linkedAdmin?.active ?? null,
          linkedAdminUserId: linkedAdmin?.id ?? null,
        };
      });
  }, [adminCandidates, adminUsers, employeeRecords, isBackendMode, role]);

  const leavePoliciesForRole = useMemo(() => {
    if (role === "Tenant Admin" || role === "HR Admin") {
      return leavePolicies;
    }

    return leavePolicies.filter((policy) => policy.enabled);
  }, [leavePolicies, role]);

  const leaveTypeOptions = useMemo(() => {
    const enabledPolicies = leavePolicies.filter((policy) => policy.enabled);

    return enabledPolicies.length
      ? enabledPolicies.map((policy) => policy.name)
      : [getFirstEnabledLeaveType(initialLeavePolicies)];
  }, [leavePolicies]);

  const attendanceItemsForRole = useMemo(() => {
    if (role === "Employee") {
      return attendanceRecords.filter((item) => item.employee === actorName);
    }

    if (role === "Manager") {
      const visibleNames = new Set([actorName, ...directReportNames]);

      return attendanceRecords.filter((item) => visibleNames.has(item.employee));
    }

    return attendanceRecords;
  }, [actorName, attendanceRecords, directReportNames, role]);

  const pendingApprovals = useMemo(() => {
    if (role === "Manager") {
      const directReportIds = new Set(scopedEmployeeRecords.map((employee) => employee.id));

      return leaveRequestsForRole.filter(
        (request) => request.status === "Pending" && directReportIds.has(request.employeeId),
      );
    }

    return leaveRequestsForRole.filter((request) => request.status === "Pending");
  }, [leaveRequestsForRole, role, scopedEmployeeRecords]);
  const approvedLeaveRequests = useMemo(
    () => leaveRequestsForRole.filter((request) => request.status === "Approved"),
    [leaveRequestsForRole],
  );
  const resolvedLeaveBalances = useMemo(() => {
    if (isBackendMode) {
      return leaveBalances;
    }

    const scopedRequests =
      role === "Employee"
        ? leaveRequests.filter((request) => request.employeeId === actor.employeeId)
        : leaveRequests;

    const enabledPolicies = leavePolicies.filter((policy) => policy.enabled);

    return enabledPolicies.map((policy) => {
      const matchingRequests = scopedRequests.filter((request) => request.leaveType === policy.name);
      const usedBalance = matchingRequests
        .filter((request) => request.status === "Approved")
        .reduce((total, request) => total + estimateLeaveDays(request.dates), 0);
      const pendingBalance = matchingRequests
        .filter((request) => request.status === "Pending")
        .reduce((total, request) => total + estimateLeaveDays(request.dates), 0);
      const remainingBalance = Math.max(
        0,
        policy.openingBalance + policy.entitlement - usedBalance,
      );

      return {
        entitlement: policy.entitlement,
        leaveType: policy.name,
        openingBalance: policy.openingBalance,
        pendingBalance,
        remainingBalance,
        usedBalance,
      };
    });
  }, [actor.employeeId, isBackendMode, leaveBalances, leavePolicies, leaveRequests, role]);
  const directReportCount = useMemo(() => {
    if (role === "Manager") {
      return scopedEmployeeRecords.length;
    }

    return profileSummary?.directReportsCount ?? 0;
  }, [profileSummary?.directReportsCount, role, scopedEmployeeRecords.length]);
  const attendanceIssueCount = useMemo(
    () =>
      attendanceItemsForRole.filter((item) => {
        const isIssue =
          item.status !== "COMPLETE" &&
          item.status !== "Complete" &&
          item.status !== "ON TIME" &&
          item.status !== "On Time";

        if (!isIssue) {
          return false;
        }

        return role === "Manager" ? directReportNames.includes(item.employee) : true;
      }).length,
    [attendanceItemsForRole, directReportNames, role],
  );
  const highlightedLeaveBalance = useMemo(
    () => resolvedLeaveBalances[0] ?? null,
    [resolvedLeaveBalances],
  );
  const localReportSections = useMemo<ReportSection[]>(
    () => [
      {
        id: "workforce",
        title: "Workforce scope",
        subtitle: isBackendMode ? "Live backend data is unavailable" : "Stored preview scope",
        metrics: [
          {
            label: role === "Manager" ? "Direct reports" : role === "Employee" ? "My profile" : "Employee records",
            note:
              role === "Manager"
                ? "Restricted to the active reporting line."
                : role === "Employee"
                  ? "Visible to the signed-in employee only."
                  : "Stored employee state survives refresh.",
            value: (role === "Manager" ? directReportCount : filteredEmployees.length).toString(),
          },
          {
            label: role === "Tenant Admin" || role === "HR Admin" ? "Departments" : "Scope",
            note:
              role === "Tenant Admin" || role === "HR Admin"
                ? "Organization structure currently available in preview state."
                : "Role boundary is applied consistently across modules.",
            value:
              role === "Tenant Admin" || role === "HR Admin"
                ? departments.length.toString()
                : role === "Manager"
                  ? "Self + team"
                  : "Self only",
          },
          {
            label: role === "Tenant Admin" ? "HR Admin users" : "Audit visibility",
            note:
              role === "Tenant Admin"
                ? "Provisioned admin access stored in preview state."
                : "Preview activity remains debug-visible during development.",
            value:
              role === "Tenant Admin" ? adminUsers.length.toString() : role === "Manager" ? "Role scoped" : "Self scoped",
          },
        ],
      },
      {
        id: "leave",
        title: "Leave operations",
        subtitle: "Workflow volume and status mix",
        metrics: [
          {
            label: role === "Employee" ? "My requests" : "Visible requests",
            note: "Pulled from the current preview workflow state.",
            value: leaveRequestsForRole.length.toString(),
          },
          {
            label: role === "Employee" ? "Pending requests" : "Pending approvals",
            note:
              role === "Manager"
                ? "Restricted to direct-report requests."
                : "Pending totals react to current leave state.",
            value: pendingApprovals.length.toString(),
          },
          {
            label: "Approved history",
            note: "Approved counts update after workflow decisions.",
            value: approvedLeaveRequests.length.toString(),
          },
        ],
      },
      {
        id: "attendance",
        title: "Attendance operations",
        subtitle: "Presence capture and exception review",
        metrics: [
          {
            label: "Visible records",
            note: "Attendance visibility respects the active role.",
            value: attendanceItemsForRole.length.toString(),
          },
          {
            label: "Attendance issues",
            note: "Late, flagged, and incomplete records are counted here.",
            value: attendanceIssueCount.toString(),
          },
          {
            label: "Current actor",
            note: "Useful when reviewing role-based preview behavior.",
            value: actorName,
          },
        ],
      },
    ],
    [
      adminUsers.length,
      actorName,
      approvedLeaveRequests.length,
      attendanceIssueCount,
      attendanceItemsForRole.length,
      departments.length,
      directReportCount,
      filteredEmployees.length,
      isBackendMode,
      leaveRequestsForRole.length,
      pendingApprovals.length,
      role,
    ],
  );
  const localAuditEntries = useMemo<AuditEntry[]>(
    () => [
      {
        actionType: "PREVIEW",
        actor: actorName,
        createdAt: new Date().toISOString(),
        description: isBackendMode
          ? "Preview fallback activity is active while backend reporting data is unavailable."
          : "Stored preview state is active for this role scope.",
        id: "LOCAL-AUDIT-01",
        module: "Preview",
        targetRecordId: role,
      },
      {
        actionType: "LEAVE",
        actor: actorName,
        createdAt: new Date().toISOString(),
        description: `${pendingApprovals.length} pending leave items are visible in the current role scope.`,
        id: "LOCAL-AUDIT-02",
        module: "Leave",
        targetRecordId: `PENDING-${pendingApprovals.length}`,
      },
      {
        actionType: "ATTENDANCE",
        actor: actorName,
        createdAt: new Date().toISOString(),
        description: `${attendanceIssueCount} attendance issue items are currently surfaced for review.`,
        id: "LOCAL-AUDIT-03",
        module: "Attendance",
        targetRecordId: `ISSUES-${attendanceIssueCount}`,
      },
    ],
    [actorName, attendanceIssueCount, isBackendMode, pendingApprovals.length, role],
  );
  const visibleReportSections = isBackendMode && reportSections.length ? reportSections : localReportSections;
  const visibleAuditEntries = isBackendMode && auditEntries.length ? auditEntries : localAuditEntries;

  const currentAttendanceRecord = useMemo(
    () =>
      attendanceItemsForRole.find(
        (item) => item.employee === actorName && isSameCalendarDate(item.attendanceDate, currentAttendanceDate),
      ) ?? null,
    [actorName, attendanceItemsForRole, currentAttendanceDate],
  );

  const attendancePrimaryLabel = currentAttendanceRecord?.timeIn
    ? currentAttendanceRecord.timeOut
      ? "Refresh entry"
      : "Clock out"
    : "Clock in";

  const attendanceStatusSummary = currentAttendanceRecord
    ? `${currentAttendanceRecord.status} (${currentAttendanceRecord.time})`
    : isBackendMode
      ? "No attendance entry has been stored for this actor yet."
      : "Ready for a new local attendance capture.";

  const attendanceHeroTime = currentAttendanceRecord?.timeIn
    ? formatAttendanceClock(currentAttendanceRecord.timeIn)
    : formatAttendanceClock(new Date().toISOString());

  const dashboardCards = useMemo(
    () => {
      if (isBackendMode && dashboardSummary) {
        if (role === "Tenant Admin") {
          return [
            {
              title: "Departments",
              value: String(dashboardSummary.departmentCount),
              note: "Tenant-wide organization structure from live backend data.",
              icon: Building2,
              accent: "from-emerald-500 to-emerald-300",
            },
            {
              title: "HR Admin Users",
              value: String(dashboardSummary.hrAdminCount),
              note: "Provisioned operations accounts in current tenant scope.",
              icon: ShieldCheck,
              accent: "from-amber-500 to-orange-300",
            },
            {
              title: "Pending Approvals",
              value: String(dashboardSummary.pendingApprovalCount),
              note: "Pending workflow items from the live approval queue.",
              icon: ClipboardList,
              accent: "from-rose-500 to-pink-300",
            },
            {
              title: "Audit Events",
              value: String(dashboardSummary.auditCount),
              note: "Recent tenant activity remains traceable in development.",
              icon: FileSpreadsheet,
              accent: "from-sky-500 to-cyan-300",
            },
          ];
        }

        if (role === "HR Admin") {
          return [
            {
              title: "Visible Employees",
              value: String(dashboardSummary.visibleEmployeeCount),
              note: "Tenant-scoped employee operations data from the backend.",
              icon: BriefcaseBusiness,
              accent: "from-emerald-500 to-emerald-300",
            },
            {
              title: "Pending Approvals",
              value: String(dashboardSummary.pendingApprovalCount),
              note: "Live workflow queue for leave approvals.",
              icon: ClipboardList,
              accent: "from-amber-500 to-orange-300",
            },
            {
              title: "Attendance Issues",
              value: String(dashboardSummary.attendanceIssueCount),
              note: "Late, flagged, and missing clock-out entries in current scope.",
              icon: CircleAlert,
              accent: "from-rose-500 to-pink-300",
            },
            {
              title: "Audit Events",
              value: String(dashboardSummary.auditCount),
              note: "Operational changes remain visible through audit logging.",
              icon: FileSpreadsheet,
              accent: "from-sky-500 to-cyan-300",
            },
          ];
        }

        if (role === "Manager") {
          return [
            {
              title: "Direct Reports",
              value: String(dashboardSummary.visibleEmployeeCount),
              note: "Limited to employees in the reporting line.",
              icon: UsersRound,
              accent: "from-emerald-500 to-emerald-300",
            },
            {
              title: "Team Approvals",
              value: String(dashboardSummary.pendingApprovalCount),
              note: "Manager queue excludes requests outside the team scope.",
              icon: ClipboardList,
              accent: "from-amber-500 to-orange-300",
            },
            {
              title: "Attendance Issues",
              value: String(dashboardSummary.attendanceIssueCount),
              note: "Direct-report exception records needing attention.",
              icon: CircleAlert,
              accent: "from-rose-500 to-pink-300",
            },
            {
              title: "My Audit Actions",
              value: String(dashboardSummary.auditCount),
              note: "Manager audit visibility remains role-scoped.",
              icon: ShieldCheck,
              accent: "from-sky-500 to-cyan-300",
            },
          ];
        }

        return [
          {
            title: "My Profile",
            value: String(dashboardSummary.visibleEmployeeCount),
            note: "Employee self-service stays limited to the linked profile.",
            icon: UserRound,
            accent: "from-emerald-500 to-emerald-300",
          },
          {
            title: "Pending Requests",
            value: String(dashboardSummary.pendingApprovalCount),
            note: "Pending leave requests from live self-service data.",
            icon: ClipboardList,
            accent: "from-amber-500 to-orange-300",
          },
          {
            title: "Attendance Records",
            value: String(dashboardSummary.attendanceRecordCount),
            note: "Attendance history now reads from backend persistence.",
            icon: Clock3,
            accent: "from-rose-500 to-pink-300",
          },
          {
            title: "My Audit Actions",
            value: String(dashboardSummary.auditCount),
            note: "Traceable self-service actions for development review.",
            icon: ShieldCheck,
            accent: "from-sky-500 to-cyan-300",
          },
        ];
      }

      return [
        {
          title: "Active Employees",
          value: String(scopedEmployeeRecords.filter((employee) => employee.status === "Active").length),
          note:
            role === "Manager"
              ? "Employee cards are restricted to direct reports."
              : role === "Employee"
                ? "Profile access stays limited to the signed-in employee."
                : "Stored records survive refresh in development preview",
          icon: BriefcaseBusiness,
          accent: "from-emerald-500 to-emerald-300",
        },
        {
          title: "Pending Approvals",
          value: String(pendingApprovals.length),
          note: isBackendMode
            ? role === "Manager"
              ? "Approval totals are limited to direct-report requests."
              : "Approval totals are reading from the live backend session."
            : "Approval totals update from saved leave workflow state",
          icon: ClipboardList,
          accent: "from-amber-500 to-orange-300",
        },
        {
          title: "Attendance Flags",
          value: String(
            attendanceItemsForRole.filter(
              (item) => item.status !== "COMPLETE" && item.status !== "Complete",
            ).length,
          ),
          note: isBackendMode
            ? "Attendance cards reflect server-backed records."
            : "Debug visibility remains on for traceable exceptions",
          icon: CircleAlert,
          accent: "from-rose-500 to-pink-300",
        },
        {
          title: "Role Scope",
          value: String(visibleModules.length),
          note:
            role === "Manager"
              ? "Direct-report visibility now unlocks the team employee view."
              : "Navigation is filtered by the active role",
          icon: ShieldCheck,
          accent: "from-sky-500 to-cyan-300",
        },
      ];
    },
    [
      dashboardSummary,
      attendanceItemsForRole,
      isBackendMode,
      pendingApprovals.length,
      role,
      scopedEmployeeRecords,
      visibleModules.length,
    ],
  );

  const showPopup = (tone: PopupTone, title: string, message: string, debugRef: string) => {
    setPopup({ tone, title, message, debugRef });
  };

  const submitTenantProfile = async () => {
    if (!tenantForm.name.trim()) {
      showPopup(
        "error",
        "Tenant update blocked",
        "Tenant name is required before saving the tenant profile.",
        "DEBUG-TENANT-VALIDATION-01",
      );
      return;
    }

    const nextTenant: TenantProfileRecord = {
      active: tenantForm.active === "true",
      code: tenantProfile.code,
      contactEmail: tenantForm.contactEmail.trim(),
      name: tenantForm.name.trim(),
    };

    if (!isBackendMode) {
      setTenantProfile(nextTenant);
      setIsTenantModalOpen(false);
      showPopup(
        "success",
        "Tenant profile updated",
        "Tenant profile changes were saved in local preview state.",
        "DEBUG-TENANT-LOCAL-01",
      );
      return;
    }

    try {
      const payload = await readJson<{
        debugRef?: string;
        item: {
          active: boolean;
          code: string;
          contactEmail?: string | null;
          name: string;
        };
      }>("/api/tenant-profile", {
        body: JSON.stringify({
          active: nextTenant.active,
          contactEmail: nextTenant.contactEmail,
          name: nextTenant.name,
        }),
        method: "PATCH",
      });

      startTransition(() => {
        setTenantProfile({
          active: payload.item.active,
          code: payload.item.code,
          contactEmail: payload.item.contactEmail ?? "",
          name: payload.item.name,
        });
        setIsTenantModalOpen(false);
      });

      showPopup(
        "success",
        "Tenant profile updated",
        "Tenant profile changes were stored through the backend API.",
        payload.debugRef ?? "DEBUG-TENANT-BACKEND-01",
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "Tenant update failed",
        failure.message,
        failure.debugRef ?? "DEBUG-TENANT-BACKEND-ERR-01",
      );
    }
  };

  const submitDepartment = async () => {
    if (!departmentForm.name.trim() || !departmentForm.code.trim()) {
      showPopup(
        "error",
        "Department save blocked",
        "Department name and code are required before saving.",
        "DEBUG-DEPARTMENT-VALIDATION-01",
      );
      return;
    }

    const nextDepartment: DepartmentRecord = {
      active: departmentForm.active === "true",
      code: departmentForm.code.trim().toUpperCase(),
      description: departmentForm.description.trim(),
      employeeCount:
        departments.find((department) => department.id === editingDepartmentId)?.employeeCount ?? 0,
      id: editingDepartmentId ?? `DEPT-${Date.now().toString().slice(-6)}`,
      managerEmployeeId: departmentForm.managerEmployeeId || null,
      managerName:
        departmentManagerOptions.find((item) => item.id === departmentForm.managerEmployeeId)?.fullName ??
        "Lead not assigned",
      name: departmentForm.name.trim(),
    };

    if (!isBackendMode) {
      setDepartments((current) =>
        editingDepartmentId
          ? current.map((department) =>
              department.id === editingDepartmentId ? nextDepartment : department,
            )
          : [nextDepartment, ...current],
      );
      setDepartmentForm(defaultDepartmentForm);
      setEditingDepartmentId(null);
      setIsDepartmentModalOpen(false);
      showPopup(
        "success",
        editingDepartmentId ? "Department updated" : "Department created",
        "Department structure changes were saved in local preview state.",
        editingDepartmentId ? "DEBUG-DEPARTMENT-LOCAL-UPDATE" : "DEBUG-DEPARTMENT-LOCAL-CREATE",
      );
      return;
    }

    try {
      const payload = await readJson<{
        debugRef?: string;
        item: {
          active: boolean;
          code: string;
          description?: string | null;
          employeeCount?: number;
          id: string;
          managerEmployeeId?: string | null;
          managerEmployee?: { fullName: string } | null;
          name: string;
        };
      }>(editingDepartmentId ? `/api/departments/${editingDepartmentId}` : "/api/departments", {
        body: JSON.stringify({
          active: nextDepartment.active,
          code: nextDepartment.code,
          description: nextDepartment.description,
          managerEmployeeId: nextDepartment.managerEmployeeId,
          name: nextDepartment.name,
        }),
        method: editingDepartmentId ? "PATCH" : "POST",
      });

      const refreshedDepartments = await readJson<{
        items: Array<{
          active: boolean;
          code: string;
          description?: string | null;
          employeeCount?: number;
          id: string;
          managerEmployeeId?: string | null;
          managerEmployee?: { fullName: string } | null;
          name: string;
        }>;
        managerCandidates: EmployeeOption[];
      }>("/api/departments");

      startTransition(() => {
        setDepartments(refreshedDepartments.items.map(mapBackendDepartmentItem));
        setManagerOptions(refreshedDepartments.managerCandidates);
        setDepartmentForm(defaultDepartmentForm);
        setEditingDepartmentId(null);
        setIsDepartmentModalOpen(false);
      });

      showPopup(
        "success",
        editingDepartmentId ? "Department updated" : "Department created",
        "Department changes were written to the backend and refreshed in the organization module.",
        payload.debugRef ?? "DEBUG-DEPARTMENT-BACKEND-01",
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "Department save failed",
        failure.message,
        failure.debugRef ?? "DEBUG-DEPARTMENT-BACKEND-ERR-01",
      );
    }
  };

  const toggleDepartmentState = async (department: DepartmentRecord) => {
    const nextActive = !department.active;

    if (!isBackendMode) {
      setDepartments((current) =>
        current.map((item) =>
          item.id === department.id ? { ...item, active: nextActive } : item,
        ),
      );
      showPopup(
        nextActive ? "success" : "warning",
        nextActive ? "Department activated" : "Department paused",
        "Department status was updated in local preview state.",
        `DEBUG-DEPARTMENT-LOCAL-${department.id}`,
      );
      return;
    }

    try {
      const payload = await readJson<{ debugRef?: string }>(`/api/departments/${department.id}`, {
        body: JSON.stringify({
          active: nextActive,
        }),
        method: "PATCH",
      });

      setDepartments((current) =>
        current.map((item) =>
          item.id === department.id ? { ...item, active: nextActive } : item,
        ),
      );

      showPopup(
        nextActive ? "success" : "warning",
        nextActive ? "Department activated" : "Department paused",
        "Department status was stored through the backend API.",
        payload.debugRef ?? `DEBUG-DEPARTMENT-${department.id}`,
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "Department update failed",
        failure.message,
        failure.debugRef ?? "DEBUG-DEPARTMENT-TOGGLE-ERR-01",
      );
    }
  };

  const submitAdminUser = async () => {
    if (!adminUserForm.employeeId || adminUserForm.password.trim().length < 8) {
      showPopup(
        "error",
        "HR Admin provisioning blocked",
        "Select an employee and provide a temporary password with at least 8 characters.",
        "DEBUG-ADMIN-VALIDATION-01",
      );
      return;
    }

    const selectedCandidate = availableAdminCandidates.find(
      (candidate) => candidate.id === adminUserForm.employeeId,
    );

    if (!selectedCandidate) {
      showPopup(
        "error",
        "HR Admin provisioning blocked",
        "The selected employee is not available for HR Admin provisioning in the current scope.",
        "DEBUG-ADMIN-CANDIDATE-01",
      );
      return;
    }

    if (!isBackendMode) {
      const nextAdmin: AdminUserRecord = {
        active: adminUserForm.active === "true",
        department: selectedCandidate.department ?? "Unassigned",
        email: `${selectedCandidate.employeeCode.toLowerCase()}@corevision.local`,
        employeeCode: selectedCandidate.employeeCode,
        employeeId: selectedCandidate.id,
        employeeName: selectedCandidate.fullName,
        id: selectedCandidate.linkedAdminUserId ?? `USR-HR-${Date.now().toString().slice(-6)}`,
        jobTitle: selectedCandidate.jobTitle,
        lastLoginAt: null,
      };

      setAdminUsers((current) => {
        const existingIndex = current.findIndex((item) => item.employeeId === selectedCandidate.id);

        if (existingIndex === -1) {
          return [nextAdmin, ...current];
        }

        return current.map((item, index) => (index === existingIndex ? nextAdmin : item));
      });

      setAdminUserForm(defaultAdminUserForm);
      setIsAdminUserModalOpen(false);
      showPopup(
        "success",
        "HR Admin access saved",
        "HR Admin access was stored in local preview state for the selected employee.",
        "DEBUG-ADMIN-LOCAL-01",
      );
      return;
    }

    try {
      const payload = await readJson<{ debugRef?: string }>("/api/admin-users", {
        body: JSON.stringify({
          active: adminUserForm.active === "true",
          employeeId: adminUserForm.employeeId,
          password: adminUserForm.password.trim(),
        }),
        method: "POST",
      });

      const refreshedAdmins = await readJson<{
        items: Array<{
          active: boolean;
          email: string;
          employeeId?: string | null;
          employee?: {
            department: string;
            employeeCode: string;
            fullName: string;
            jobTitle: string;
          } | null;
          id: string;
          lastLoginAt?: string | null;
        }>;
        candidates: EmployeeOption[];
      }>("/api/admin-users");

      startTransition(() => {
        setAdminUsers(refreshedAdmins.items.map(mapBackendAdminUser));
        setAdminCandidates(refreshedAdmins.candidates);
        setAdminUserForm(defaultAdminUserForm);
        setIsAdminUserModalOpen(false);
      });

      showPopup(
        "success",
        "HR Admin access saved",
        "HR Admin access was written through the backend API for the selected employee.",
        payload.debugRef ?? "DEBUG-ADMIN-BACKEND-01",
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "HR Admin provisioning failed",
        failure.message,
        failure.debugRef ?? "DEBUG-ADMIN-BACKEND-ERR-01",
      );
    }
  };

  const toggleAdminUserState = async (adminUser: AdminUserRecord) => {
    const nextActive = !adminUser.active;

    if (!isBackendMode) {
      setAdminUsers((current) =>
        current.map((item) =>
          item.id === adminUser.id ? { ...item, active: nextActive } : item,
        ),
      );
      showPopup(
        nextActive ? "success" : "warning",
        nextActive ? "HR Admin activated" : "HR Admin paused",
        "HR Admin access status was updated in local preview state.",
        `DEBUG-ADMIN-LOCAL-${adminUser.id}`,
      );
      return;
    }

    try {
      const payload = await readJson<{ debugRef?: string }>(`/api/admin-users/${adminUser.id}`, {
        body: JSON.stringify({
          active: nextActive,
        }),
        method: "PATCH",
      });

      setAdminUsers((current) =>
        current.map((item) =>
          item.id === adminUser.id ? { ...item, active: nextActive } : item,
        ),
      );

      showPopup(
        nextActive ? "success" : "warning",
        nextActive ? "HR Admin activated" : "HR Admin paused",
        "HR Admin access status was stored through the backend API.",
        payload.debugRef ?? `DEBUG-ADMIN-${adminUser.id}`,
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "HR Admin update failed",
        failure.message,
        failure.debugRef ?? "DEBUG-ADMIN-TOGGLE-ERR-01",
      );
    }
  };

  const refreshEmployeeRecords = async () => {
    const refreshedEmployees = await readJson<{
      items: Array<{
        id: string;
        employeeCode: string;
        fullName: string;
        department: string;
        employmentStatus?: string;
        jobTitle: string;
        profileStatus: string;
        email: string;
        workLocation?: string | null;
        manager?: { fullName: string } | null;
      }>;
    }>("/api/employees");

    startTransition(() => {
      setEmployeeRecords(refreshedEmployees.items.map(mapBackendEmployee));
    });
  };

  const refreshAttendanceRecords = async () => {
    const refreshedAttendance = await readJson<{
      items: Array<{
        id: string;
        attendanceDate: string;
        employeeId?: string;
        employee: { fullName: string; employeeCode?: string };
        remarks?: string | null;
        reviewedAt?: string | null;
        reviewedBy?: { email: string } | null;
        timeIn?: string | null;
        timeOut?: string | null;
        status: string;
      }>;
    }>("/api/attendance");

    startTransition(() => {
      setAttendanceRecords(refreshedAttendance.items.map(mapBackendAttendanceItem));
    });
  };

  const refreshLeaveState = async () => {
    const [leavePolicyPayload, leaveRequestPayload, leaveBalancePayload] = await Promise.all([
      readJson<{
        items: Array<{
          code: string;
          enabled: boolean;
          entitlement: number;
          id: string;
          name: string;
          openingBalance: number;
        }>;
      }>("/api/leave-types"),
      readJson<{
        items: Array<{
          approvalRemarks?: string | null;
          id: string;
          employeeId: string;
          employee: { fullName: string };
          leaveType: string;
          startDate: string;
          endDate: string;
          reason: string;
          status: "PENDING" | "APPROVED" | "REJECTED";
        }>;
      }>("/api/leave-requests"),
      readJson<{
        items: LeaveBalanceItem[];
      }>("/api/leave-balance").catch(() => ({ items: [] })),
    ]);

    startTransition(() => {
      setLeavePolicies(leavePolicyPayload.items.map(mapBackendLeavePolicy));
      setLeaveRequests(leaveRequestPayload.items.map(mapBackendLeaveRequest));
      setLeaveBalances(leaveBalancePayload.items);
    });
  };

  const refreshOperationalInsights = async () => {
    if (!isBackendMode) {
      return;
    }

    const [dashboardPayload, reportsPayload, auditPayload] = await Promise.all([
      readJson<{ item: DashboardSummary }>("/api/dashboard"),
      readJson<{ items: ReportSection[] }>("/api/reports"),
      readJson<{ items: AuditEntry[] }>("/api/audit-log"),
    ]);

    startTransition(() => {
      setDashboardSummary(dashboardPayload.item);
      setReportSections(reportsPayload.items);
      setAuditEntries(auditPayload.items);
    });
  };

  const openEmployeeEditor = (employeeId: string) => {
    const selectedEmployee = employeeRecords.find((item) => item.id === employeeId);

    if (!selectedEmployee) {
      return;
    }

    setEditingEmployeeRecordId(selectedEmployee.recordId ?? selectedEmployee.id);
    setEmployeeForm({
      id: selectedEmployee.id,
      employmentStatus: selectedEmployee.employmentStatus ?? "Permanent",
      workLocation: selectedEmployee.workLocation ?? "Kuala Lumpur",
      name: selectedEmployee.name,
      team: selectedEmployee.team,
      title: selectedEmployee.title,
      email: selectedEmployee.email,
      manager: selectedEmployee.manager === "Assigned manager pending" ? "" : selectedEmployee.manager,
      status: selectedEmployee.status.toUpperCase().replaceAll(" ", "_"),
    });
    setIsEmployeeModalOpen(true);
  };

  const openAttendanceReview = (attendanceId: string) => {
    const selectedAttendance = attendanceRecords.find((item) => item.id === attendanceId);

    if (!selectedAttendance) {
      return;
    }

    setReviewingAttendanceId(selectedAttendance.id);
    setAttendanceReviewForm({
      remarks: selectedAttendance.remarks ?? "",
      reviewedAt: formatDateTimeInputValue(selectedAttendance.reviewedAt),
      status: toAttendanceStatusValue(selectedAttendance.status),
      timeIn: formatDateTimeInputValue(selectedAttendance.timeIn),
      timeOut: formatDateTimeInputValue(selectedAttendance.timeOut),
    });
    setIsAttendanceReviewModalOpen(true);
  };

  const openLeavePolicyEditor = (leavePolicyId: string) => {
    const selectedPolicy = leavePolicies.find((item) => item.id === leavePolicyId);

    if (!selectedPolicy) {
      return;
    }

    setEditingLeavePolicyId(selectedPolicy.id);
    setLeavePolicyForm({
      code: selectedPolicy.code,
      enabled: selectedPolicy.enabled ? "true" : "false",
      entitlement: selectedPolicy.entitlement.toString(),
      name: selectedPolicy.name,
      openingBalance: selectedPolicy.openingBalance.toString(),
    });
    setIsLeavePolicyModalOpen(true);
  };

  const submitEmployee = async () => {
    const id = employeeForm.id.trim().toUpperCase();

    if (!id || !employeeForm.name.trim() || !employeeForm.team.trim() || !employeeForm.title.trim()) {
      showPopup(
        "error",
        "Employee save blocked",
        "Required employee fields are missing. Fill in id, name, team, and title before saving.",
        "DEBUG-EMP-VALIDATION-01",
      );
      return;
    }

    const existingEmployeeCode = employeeRecords.find(
      (employee) =>
        employee.id.toUpperCase() === id &&
        (editingEmployeeRecordId ? (employee.recordId ?? employee.id) !== editingEmployeeRecordId : true),
    );

    if (existingEmployeeCode) {
      showPopup(
        "error",
        "Duplicate employee id",
        "The selected employee id already exists in this tenant preview. Use a unique id before saving.",
        "DEBUG-EMP-DUPLICATE-01",
      );
      return;
    }

    const newEmployee: EmployeeRecord = {
      id,
      recordId: editingEmployeeRecordId ?? id,
      name: employeeForm.name.trim(),
      team: employeeForm.team.trim(),
      title: employeeForm.title.trim(),
      status: employeeForm.status.replaceAll("_", " "),
      email: employeeForm.email.trim() || `${id.toLowerCase()}@corevision.local`,
      manager: employeeForm.manager.trim() || "Unassigned",
      employmentStatus: employeeForm.employmentStatus.trim() || "Permanent",
      workLocation: employeeForm.workLocation.trim() || "Kuala Lumpur",
    };

    if (!isBackendMode) {
      setEmployeeRecords((current) =>
        editingEmployeeRecordId
          ? current.map((employee) =>
              (employee.recordId ?? employee.id) === editingEmployeeRecordId ? newEmployee : employee,
            )
          : [newEmployee, ...current],
      );
      setIsEmployeeModalOpen(false);
      setEditingEmployeeRecordId(null);
      setEmployeeForm(defaultEmployeeForm);
      showPopup(
        "success",
        editingEmployeeRecordId ? "Employee updated" : "Employee saved",
        editingEmployeeRecordId
          ? "The employee record was updated in stored local state and is now reflected across the preview."
          : "The employee record was added to stored local state and is now available in the employee list and reports.",
        `DEBUG-${newEmployee.id}`,
      );
      return;
    }

    try {
      const selectedManager = departmentManagerOptions.find(
        (option) => option.fullName === employeeForm.manager.trim(),
      );
      const payload = await readJson<{
        debugRef?: string;
      }>(editingEmployeeRecordId ? `/api/employees/${editingEmployeeRecordId}` : "/api/employees", {
        body: JSON.stringify({
          department: employeeForm.team.trim(),
          email: employeeForm.email.trim() || `${id.toLowerCase()}@corevision.local`,
          ...(editingEmployeeRecordId ? {} : { employeeCode: id, tenantCode: session?.tenantCode }),
          employmentStatus: employeeForm.employmentStatus.trim() || "Permanent",
          fullName: employeeForm.name.trim(),
          hireDate: undefined,
          identityNumber: undefined,
          jobTitle: employeeForm.title.trim(),
          managerId: selectedManager?.id ?? null,
          phoneNumber: undefined,
          preferredName: undefined,
          profileStatus: employeeForm.status,
          workLocation: employeeForm.workLocation.trim() || "Kuala Lumpur",
        }),
        method: editingEmployeeRecordId ? "PATCH" : "POST",
      });

      await Promise.all([refreshEmployeeRecords(), refreshOperationalInsights()]);

      startTransition(() => {
        setIsEmployeeModalOpen(false);
        setEditingEmployeeRecordId(null);
        setEmployeeForm(defaultEmployeeForm);
      });

      showPopup(
        "success",
        editingEmployeeRecordId ? "Employee updated" : "Employee saved",
        editingEmployeeRecordId
          ? "The employee record was updated through the backend and refreshed in the preview list."
          : "The employee record was written to the backend and refreshed in the preview list.",
        payload.debugRef ?? `DEBUG-${newEmployee.id}`,
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? (editingEmployeeRecordId ? "Employee update failed" : "Employee save failed"),
        failure.message,
        failure.debugRef ?? "DEBUG-EMP-BACKEND-01",
      );
    }
  };

  const submitAttendanceReview = async () => {
    if (!reviewingAttendanceId) {
      return;
    }

    const normalizedTimeIn = normalizeDateTimeInput(attendanceReviewForm.timeIn);
    const normalizedTimeOut = normalizeDateTimeInput(attendanceReviewForm.timeOut);
    const normalizedReviewedAt = normalizeDateTimeInput(attendanceReviewForm.reviewedAt);

    if (attendanceReviewForm.timeIn.trim() && !normalizedTimeIn) {
      showPopup(
        "error",
        "Attendance review blocked",
        "Time in must be a valid datetime before the review can be saved.",
        "DEBUG-ATTENDANCE-REVIEW-TIMEIN-01",
      );
      return;
    }

    if (attendanceReviewForm.timeOut.trim() && !normalizedTimeOut) {
      showPopup(
        "error",
        "Attendance review blocked",
        "Time out must be a valid datetime before the review can be saved.",
        "DEBUG-ATTENDANCE-REVIEW-TIMEOUT-01",
      );
      return;
    }

    if (attendanceReviewForm.reviewedAt.trim() && !normalizedReviewedAt) {
      showPopup(
        "error",
        "Attendance review blocked",
        "Reviewed at must be a valid datetime before the review can be saved.",
        "DEBUG-ATTENDANCE-REVIEW-REVIEWEDAT-01",
      );
      return;
    }

    if (!isBackendMode) {
      setAttendanceRecords((current) =>
        current.map((item) =>
          item.id === reviewingAttendanceId
            ? {
                ...item,
                remarks: attendanceReviewForm.remarks.trim() || null,
                reviewedAt: normalizedReviewedAt ?? new Date().toISOString(),
                reviewedBy: "local.hr.review",
                status: fromAttendanceStatusValue(attendanceReviewForm.status),
                timeIn: normalizedTimeIn,
                timeOut: normalizedTimeOut,
                time: formatAttendanceWindow(normalizedTimeIn, normalizedTimeOut),
              }
            : item,
        ),
      );
      setIsAttendanceReviewModalOpen(false);
      setReviewingAttendanceId(null);
      setAttendanceReviewForm(defaultAttendanceReviewForm);
      showPopup(
        "success",
        "Attendance reviewed",
        "Attendance review changes were stored in local preview state and are visible in the attendance list.",
        `DEBUG-ATTENDANCE-REVIEW-${reviewingAttendanceId}`,
      );
      return;
    }

    try {
      const payload = await readJson<{
        debugRef?: string;
      }>(`/api/attendance/${reviewingAttendanceId}`, {
        body: JSON.stringify({
          remarks: attendanceReviewForm.remarks.trim() || undefined,
          reviewedAt: normalizedReviewedAt ?? undefined,
          status: attendanceReviewForm.status,
          timeIn: normalizedTimeIn,
          timeOut: normalizedTimeOut,
        }),
        method: "PATCH",
      });

      await Promise.all([refreshAttendanceRecords(), refreshOperationalInsights()]);

      startTransition(() => {
        setIsAttendanceReviewModalOpen(false);
        setReviewingAttendanceId(null);
        setAttendanceReviewForm(defaultAttendanceReviewForm);
      });

      showPopup(
        "success",
        "Attendance reviewed",
        "Attendance review changes were written to the backend and refreshed in the attendance list.",
        payload.debugRef ?? `DEBUG-ATTENDANCE-REVIEW-${reviewingAttendanceId}`,
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "Attendance review failed",
        failure.message,
        failure.debugRef ?? "DEBUG-ATTENDANCE-REVIEW-ERR-01",
      );
    }
  };

  const submitLeavePolicy = async () => {
    const code = leavePolicyForm.code.trim().toUpperCase();
    const name = leavePolicyForm.name.trim();
    const entitlement = Number(leavePolicyForm.entitlement);
    const openingBalance = Number(leavePolicyForm.openingBalance);

    if (
      !code ||
      !name ||
      Number.isNaN(entitlement) ||
      Number.isNaN(openingBalance) ||
      entitlement < 0 ||
      openingBalance < 0
    ) {
      showPopup(
        "error",
        "Leave policy save blocked",
        "Code, name, opening balance, and entitlement are required for leave policy setup, and balances cannot be negative.",
        "DEBUG-LEAVE-POLICY-VALIDATION-01",
      );
      return;
    }

    const duplicate = leavePolicies.find(
      (policy) =>
        (policy.code === code || policy.name.toLowerCase() === name.toLowerCase()) &&
        policy.id !== editingLeavePolicyId,
    );

    if (duplicate) {
      showPopup(
        "error",
        "Leave policy save blocked",
        "Leave policy code and name must remain unique within this tenant.",
        "DEBUG-LEAVE-POLICY-DUPLICATE-01",
      );
      return;
    }

    const nextPolicy: LeavePolicyRecord = {
      code,
      enabled: leavePolicyForm.enabled === "true",
      entitlement,
      id: editingLeavePolicyId ?? `LEAVE-${Date.now().toString().slice(-6)}`,
      name,
      openingBalance,
    };

    if (!isBackendMode) {
      setLeavePolicies((current) =>
        editingLeavePolicyId
          ? current.map((policy) => (policy.id === editingLeavePolicyId ? nextPolicy : policy))
          : [...current, nextPolicy],
      );
      setIsLeavePolicyModalOpen(false);
      setEditingLeavePolicyId(null);
      setLeavePolicyForm(defaultLeavePolicyForm);
      showPopup(
        "success",
        editingLeavePolicyId ? "Leave policy updated" : "Leave policy created",
        "Leave policy values were stored in local preview state and now drive the available leave types.",
        "DEBUG-LEAVE-POLICY-LOCAL-01",
      );
      return;
    }

    try {
      const payload = await readJson<{ debugRef?: string }>(
        editingLeavePolicyId ? `/api/leave-types/${editingLeavePolicyId}` : "/api/leave-types",
        {
          body: JSON.stringify({
            code,
            enabled: leavePolicyForm.enabled === "true",
            entitlement,
            name,
            openingBalance,
          }),
          method: editingLeavePolicyId ? "PATCH" : "POST",
        },
      );

      await Promise.all([refreshLeaveState(), refreshOperationalInsights()]);

      startTransition(() => {
        setIsLeavePolicyModalOpen(false);
        setEditingLeavePolicyId(null);
        setLeavePolicyForm(defaultLeavePolicyForm);
      });

      showPopup(
        "success",
        editingLeavePolicyId ? "Leave policy updated" : "Leave policy created",
        "Leave policy changes were written to the backend and refreshed in the preview portal.",
        payload.debugRef ?? "DEBUG-LEAVE-POLICY-BACKEND-01",
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "Leave policy save failed",
        failure.message,
        failure.debugRef ?? "DEBUG-LEAVE-POLICY-BACKEND-ERR-01",
      );
    }
  };

  const submitApprovalDecision = async () => {
    if (!approvalDecisionRequestId) {
      return;
    }

    const remarks = approvalDecisionForm.remarks.trim();

    if (approvalDecisionForm.status === "Rejected" && !remarks) {
      showPopup(
        "error",
        "Approval decision blocked",
        "Rejection remarks are required before this leave request can be rejected.",
        "DEBUG-APPROVAL-REMARKS-01",
      );
      return;
    }

    if (!isBackendMode) {
      setLeaveRequests((current) =>
        current.map((request) =>
          request.id === approvalDecisionRequestId
            ? {
                ...request,
                approvalRemarks: remarks || null,
                status: approvalDecisionForm.status,
              }
            : request,
        ),
      );
      setApprovalDecisionRequestId(null);
      setApprovalDecisionForm(defaultApprovalDecisionForm);
      setIsApprovalDecisionModalOpen(false);
      showPopup(
        approvalDecisionForm.status === "Approved" ? "success" : "warning",
        approvalDecisionForm.status === "Approved" ? "Request approved" : "Request rejected",
        "The leave request decision and reviewer remarks were stored in local preview state.",
        `DEBUG-${approvalDecisionRequestId}-${approvalDecisionForm.status.toUpperCase()}`,
      );
      return;
    }

    try {
      const payload = await readJson<{ debugRef?: string }>(
        `/api/approvals/${approvalDecisionRequestId}`,
        {
          body: JSON.stringify({
            approvalRemarks: remarks || undefined,
            status: approvalDecisionForm.status === "Approved" ? "APPROVED" : "REJECTED",
          }),
          method: "PATCH",
        },
      );

      await Promise.all([refreshLeaveState(), refreshOperationalInsights()]);

      startTransition(() => {
        setApprovalDecisionRequestId(null);
        setApprovalDecisionForm(defaultApprovalDecisionForm);
        setIsApprovalDecisionModalOpen(false);
      });

      showPopup(
        approvalDecisionForm.status === "Approved" ? "success" : "warning",
        approvalDecisionForm.status === "Approved" ? "Request approved" : "Request rejected",
        "The leave request decision and reviewer remarks were written to the backend queue.",
        payload.debugRef ?? `DEBUG-${approvalDecisionRequestId}-${approvalDecisionForm.status.toUpperCase()}`,
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "Approval update failed",
        failure.message,
        failure.debugRef ?? "DEBUG-APPROVAL-BACKEND-01",
      );
    }
  };

  const submitLeaveRequest = async () => {
    if (!leaveForm.dates.trim() || !leaveForm.reason.trim() || !leaveForm.leaveType.trim()) {
      showPopup(
        "error",
        "Leave request blocked",
        "Leave type, date range, and reason are required before a leave request can be submitted.",
        "DEBUG-LV-VALIDATION-01",
      );
      return;
    }

    if (!leaveTypeOptions.includes(leaveForm.leaveType)) {
      showPopup(
        "error",
        "Leave request blocked",
        "The selected leave type is not enabled in the current tenant policy setup.",
        "DEBUG-LV-POLICY-01",
      );
      return;
    }

    const newRequest: LeaveRequest = {
      approvalRemarks: null,
      id: `LV-${Date.now().toString().slice(-6)}`,
      employeeId: leaveForm.employeeId,
      employee: leaveForm.employee,
      leaveType: leaveForm.leaveType,
      dates: leaveForm.dates.trim(),
      reason: leaveForm.reason.trim(),
      status: "Pending",
    };

    if (!isBackendMode) {
      setLeaveRequests((current) => [newRequest, ...current]);
      setIsLeaveModalOpen(false);
      setLeaveForm({
        ...defaultLeaveFormForRole(role),
        leaveType: getFirstEnabledLeaveType(leavePolicies),
      });
      showPopup(
        "success",
        "Leave request submitted",
        "The request was stored locally and added to the approval queue for the next reviewer.",
        `DEBUG-${newRequest.id}`,
      );
      return;
    }

    const parsedRange = parseDateRangeInput(leaveForm.dates);

    if (!parsedRange || !session?.employeeId) {
      showPopup(
        "error",
        "Leave request blocked",
        "Backend leave mode expects dates in YYYY-MM-DD or YYYY-MM-DD to YYYY-MM-DD format.",
        "DEBUG-LV-BACKEND-DATE-01",
      );
      return;
    }

    try {
      const payload = await readJson<{
        debugRef?: string;
      }>("/api/leave-requests", {
        body: JSON.stringify({
          employeeId: session.employeeId,
          endDate: parsedRange.endDate,
          leaveType: leaveForm.leaveType,
          reason: leaveForm.reason.trim(),
          startDate: parsedRange.startDate,
          tenantCode: session.tenantCode,
          totalDays: parsedRange.totalDays,
        }),
        method: "POST",
      });

      await Promise.all([refreshLeaveState(), refreshOperationalInsights()]);

      startTransition(() => {
        setIsLeaveModalOpen(false);
        setLeaveForm({
          employee: session.employee,
          employeeId: session.employeeId ?? "",
          leaveType: getFirstEnabledLeaveType(leavePolicies),
          dates: "",
          reason: "",
        });
      });

      showPopup(
        "success",
        "Leave request submitted",
        "The request was written to the backend and refreshed in the preview queue.",
        payload.debugRef ?? `DEBUG-${newRequest.id}`,
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "Leave request failed",
        failure.message,
        failure.debugRef ?? "DEBUG-LV-BACKEND-01",
      );
    }
  };

  const updateLeaveStatus = async (requestId: string, nextStatus: "Approved" | "Rejected") => {
    const selectedRequest = leaveRequests.find((request) => request.id === requestId);

    setApprovalDecisionRequestId(requestId);
    setApprovalDecisionForm({
      remarks:
        selectedRequest?.approvalRemarks ??
        (nextStatus === "Approved"
          ? "Approved during preview review."
          : ""),
      status: nextStatus,
    });
    setIsApprovalDecisionModalOpen(true);
  };

  const submitAttendanceAction = async (action: "clock" | "flag") => {
    const actionDate = buildAttendanceDateIso();
    const actionTimestamp = new Date().toISOString();
    const existingRecord =
      attendanceRecords.find(
        (item) => item.employee === actorName && isSameCalendarDate(item.attendanceDate, actionDate),
      ) ?? null;
    const isClockOut = action === "clock" && Boolean(existingRecord?.timeIn) && !existingRecord?.timeOut;
    const isRefresh = action === "clock" && Boolean(existingRecord?.timeOut);

    if (!isBackendMode) {
      const nextRecord: AttendanceItem =
        action === "flag"
          ? {
              attendanceDate: actionDate,
              id: existingRecord?.id ?? `AT-${Date.now().toString().slice(-6)}`,
              employee: actorName,
              status: "Flagged",
              time: formatAttendanceWindow(existingRecord?.timeIn ?? actionTimestamp, existingRecord?.timeOut),
              timeIn: existingRecord?.timeIn ?? actionTimestamp,
              timeOut: existingRecord?.timeOut ?? null,
            }
          : isClockOut && existingRecord
            ? {
                attendanceDate: actionDate,
                employee: existingRecord.employee,
                id: existingRecord.id,
                status: "Complete",
                time: formatAttendanceWindow(existingRecord.timeIn, actionTimestamp),
                timeIn: existingRecord.timeIn,
                timeOut: actionTimestamp,
              }
            : {
                attendanceDate: actionDate,
                id: existingRecord?.id ?? `AT-${Date.now().toString().slice(-6)}`,
                employee: actorName,
                status: "On Time",
                time: formatAttendanceWindow(actionTimestamp, null),
                timeIn: actionTimestamp,
                timeOut: null,
              };

      setAttendanceRecords((current) => {
        const remaining = current.filter((item) => item.id !== nextRecord.id);
        return [nextRecord, ...remaining];
      });

      showPopup(
        action === "flag" ? "warning" : "success",
        action === "flag"
          ? "Attendance exception flagged"
          : isClockOut
            ? "Clock out saved"
            : isRefresh
              ? "Attendance refreshed"
            : "Clock in saved",
        action === "flag"
          ? "The attendance record was flagged locally and is ready for reviewer follow-up."
          : "The attendance record was updated in local preview state and is visible in the attendance list.",
        `DEBUG-AT-LOCAL-${action.toUpperCase()}`,
      );
      return;
    }

    if (!session?.employeeId) {
      showPopup(
        "error",
        "Attendance action blocked",
        "This signed-in account does not have an employee profile bound to attendance capture yet.",
        "DEBUG-AT-BACKEND-EMPLOYEE-01",
      );
      return;
    }

    const backendStatus =
      action === "flag" ? "FLAGGED" : isClockOut ? "COMPLETE" : "ON_TIME";

    const requestBody = {
      attendanceDate: actionDate,
      employeeId: session.employeeId,
      remarks:
        action === "flag"
          ? "Flagged from preview attendance workflow."
          : isClockOut
            ? "Clock out captured from preview attendance workflow."
            : isRefresh
              ? "Attendance entry refreshed from preview attendance workflow."
            : "Clock in captured from preview attendance workflow.",
      status: backendStatus,
      tenantCode: session.tenantCode,
      timeIn: isClockOut ? existingRecord?.timeIn ?? actionTimestamp : actionTimestamp,
      ...(isClockOut ? { timeOut: actionTimestamp } : {}),
    };

    setIsAttendanceSubmitting(true);

    try {
      const payload = await readJson<{
        debugRef?: string;
      }>("/api/attendance", {
        body: JSON.stringify(requestBody),
        method: "POST",
      });

      const refreshedAttendance = await readJson<{
        items: Array<{
          id: string;
          attendanceDate: string;
          employee: { fullName: string };
          timeIn?: string | null;
          timeOut?: string | null;
          status: string;
        }>;
      }>("/api/attendance");

      startTransition(() => {
        setAttendanceRecords(refreshedAttendance.items.map(mapBackendAttendanceItem));
      });

      showPopup(
        action === "flag" ? "warning" : "success",
        action === "flag"
          ? "Attendance exception flagged"
          : isClockOut
            ? "Clock out saved"
            : isRefresh
              ? "Attendance refreshed"
            : "Clock in saved",
        action === "flag"
          ? "The attendance record was updated in the backend and refreshed in the preview review list."
          : "The attendance record was written through the backend API and refreshed in the preview review list.",
        payload.debugRef ?? `DEBUG-AT-BACKEND-${action.toUpperCase()}`,
      );
    } catch (error) {
      const failure = error as Error & { debugRef?: string; title?: string };
      showPopup(
        "error",
        failure.title ?? "Attendance save failed",
        failure.message,
        failure.debugRef ?? "DEBUG-AT-BACKEND-01",
      );
    } finally {
      setIsAttendanceSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_28%),linear-gradient(180deg,_#f4f8fb_0%,_#eef3f8_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
        <aside className="w-full rounded-[32px] border border-white/70 bg-slate-950 px-5 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[300px]">
          <div className="rounded-[28px] bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Core Vision</p>
                <h1 className="text-xl font-semibold">HRMS Portal</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              SaaS-ready MVP foundation with role-aware navigation, stored workflow state, and centered popup feedback.
            </p>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Modules</p>
            <nav className="mt-3 grid gap-2">
              {navItems
                .filter((item) => visibleModules.includes(item.key))
                .map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.key;

                return (
                  <button
                    key={item.key}
                    className={classNames(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                      isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )}
                    onClick={() => setActiveModule(item.key)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Role preview</p>
            <label className="mt-3 block">
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                disabled={isBackendMode}
                onChange={(event) => setRole(event.target.value as Role)}
                value={role}
              >
                <option>Tenant Admin</option>
                <option>HR Admin</option>
                <option>Manager</option>
                <option>Employee</option>
              </select>
            </label>
            <p className="mt-3 text-sm leading-6 text-slate-300">{roleDescriptions[role]}</p>
            <p className="mt-2 text-xs text-slate-400">
              {isBackendMode ? `Locked to signed-in role for ${session?.email}.` : "Preview mode allows manual role switching."}
            </p>
          </div>
        </aside>

        <main className="flex-1">
          <section className="rounded-[32px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur lg:p-6">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {isBackendMode ? "Developer implementation slice 11" : "Preview sandbox"}
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  {isBackendMode
                    ? "Role-scoped preview with live backend sync"
                    : "Role-scoped navigation and stored workflows"}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-[240px] items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
                  <Search className="h-4 w-4" />
                  <input
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search employees or teams"
                    value={search}
                  />
                </label>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                  Current role: <span className="font-semibold text-slate-900">{role}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                  <UserRound className="h-4 w-4" />
                  {isBackendMode ? "Live backend session" : "Stored locally"}
                </div>
                {isSyncing ? (
                  <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
                    Syncing
                  </div>
                ) : null}
                <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Debug enabled</div>
              </div>
            </header>

            <section className="mt-6 grid gap-3 md:grid-cols-3">
              <DebugAction
                label="Unauthorized state"
                note="Open the shared restricted-access surface for QA."
                onClick={() => setOverlayState("unauthorized")}
              />
              <DebugAction
                label="Generic error state"
                note="Open the shared generic error surface with debug context."
                onClick={() => setOverlayState("error")}
              />
              <DebugAction
                label="Clear overlays"
                note="Return to the active module after debug-state review."
                onClick={() => setOverlayState("none")}
              />
            </section>

            {overlayState !== "none" ? <StateSurface overlayState={overlayState} onDismiss={() => setOverlayState("none")} /> : null}

            <section className="mt-6">
              {renderModuleContent(
                activeModule,
                role,
                tenantProfile,
                departments,
                adminUsers,
                availableAdminCandidates,
                filteredEmployees,
                leavePoliciesForRole,
                leaveRequestsForRole,
                attendanceItemsForRole,
                dashboardCards,
                visibleReportSections,
                visibleAuditEntries,
                pendingApprovals,
                approvedLeaveRequests.length,
                directReportCount,
                attendanceIssueCount,
                profileSummary,
                resolvedLeaveBalances,
                highlightedLeaveBalance,
                showPopup,
                updateLeaveStatus,
                attendanceHeroTime,
                attendanceStatusSummary,
                attendancePrimaryLabel,
                () => {
                  void submitAttendanceAction("clock");
                },
                () => {
                  void submitAttendanceAction("flag");
                },
                isAttendanceSubmitting,
                () => {
                  setTenantForm({
                    active: tenantProfile.active ? "true" : "false",
                    contactEmail: tenantProfile.contactEmail,
                    name: tenantProfile.name,
                  });
                  setIsTenantModalOpen(true);
                },
                () => {
                  setEditingDepartmentId(null);
                  setDepartmentForm(defaultDepartmentForm);
                  setIsDepartmentModalOpen(true);
                },
                (departmentId: string) => {
                  const selectedDepartment = departments.find((item) => item.id === departmentId);

                  if (!selectedDepartment) {
                    return;
                  }

                  setEditingDepartmentId(selectedDepartment.id);
                  setDepartmentForm({
                    active: selectedDepartment.active ? "true" : "false",
                    code: selectedDepartment.code,
                    description: selectedDepartment.description,
                    managerEmployeeId: selectedDepartment.managerEmployeeId ?? "",
                    name: selectedDepartment.name,
                  });
                  setIsDepartmentModalOpen(true);
                },
                (adminEmployeeId?: string) => {
                  setAdminUserForm({
                    active: "true",
                    employeeId: adminEmployeeId ?? "",
                    password: "",
                  });
                  setIsAdminUserModalOpen(true);
                },
                (department) => {
                  void toggleDepartmentState(department);
                },
                (adminUser) => {
                  void toggleAdminUserState(adminUser);
                },
                () => {
                  setEditingEmployeeRecordId(null);
                  setEmployeeForm(defaultEmployeeForm);
                  setIsEmployeeModalOpen(true);
                },
                (employeeId: string) => {
                  openEmployeeEditor(employeeId);
                },
                () => {
                  setEditingLeavePolicyId(null);
                  setLeavePolicyForm(defaultLeavePolicyForm);
                  setIsLeavePolicyModalOpen(true);
                },
                (leavePolicyId: string) => {
                  openLeavePolicyEditor(leavePolicyId);
                },
                () => {
                  setLeaveForm(
                    session
                      ? {
                          employee: session.employee,
                          employeeId: session.employeeId ?? "",
                          leaveType: getFirstEnabledLeaveType(leavePolicies),
                          dates: "",
                          reason: "",
                        }
                      : {
                          ...defaultLeaveFormForRole(role),
                          leaveType: getFirstEnabledLeaveType(leavePolicies),
                        },
                  );
                  setIsLeaveModalOpen(true);
                },
                isBackendMode,
                (attendanceId: string) => {
                  openAttendanceReview(attendanceId);
                },
                session?.employee,
              )}
            </section>

            <section className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Debug console</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <DebugChip label="Role scope" value={`${visibleModules.length} modules visible for ${role}.`} />
                <DebugChip
                  label={isBackendMode ? "Employee sync" : "Stored employees"}
                  value={
                    isBackendMode
                      ? `${employeeRecords.length} employee records synced from the backend session.`
                      : `${scopedEmployeeRecords.length} records currently saved in local state.`
                  }
                />
                <DebugChip
                  label={isBackendMode ? "Leave sync" : "Stored leave requests"}
                  value={
                    isBackendMode
                      ? `${leaveRequestsForRole.length} leave records synced from the backend session.`
                      : `${leaveRequestsForRole.length} requests currently saved in local state.`
                  }
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {isBackendMode
                  ? "This preview is authenticated and syncs with the backend while preserving centered popup feedback and visible debug references."
                  : "This slice keeps debug references visible so QA can trace workflow results while backend integration is still pending."}
              </p>
            </section>
          </section>
        </main>
      </div>

      {popup ? <FeedbackModal popup={popup} onClose={() => setPopup(null)} /> : null}
      {isEmployeeModalOpen ? (
        <CenteredModal
          title={editingEmployeeRecordId ? "Edit employee" : "Add employee"}
          onClose={() => {
            setEditingEmployeeRecordId(null);
            setIsEmployeeModalOpen(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {editingEmployeeRecordId ? (
              <ReadOnlyField label="Employee id" value={employeeForm.id} />
            ) : (
              <ModalField
                label="Employee id"
                value={employeeForm.id}
                onChange={(value) => setEmployeeForm((current) => ({ ...current, id: value }))}
              />
            )}
            <ModalField
              label="Full name"
              value={employeeForm.name}
              onChange={(value) => setEmployeeForm((current) => ({ ...current, name: value }))}
            />
            <ModalField
              label="Team"
              value={employeeForm.team}
              onChange={(value) => setEmployeeForm((current) => ({ ...current, team: value }))}
            />
            <ModalField
              label="Title"
              value={employeeForm.title}
              onChange={(value) => setEmployeeForm((current) => ({ ...current, title: value }))}
            />
            <ModalField
              label="Email"
              value={employeeForm.email}
              onChange={(value) => setEmployeeForm((current) => ({ ...current, email: value }))}
            />
            <ModalSelect
              label="Employment status"
              options={["Permanent", "Contract", "Probation", "Intern", "Resigned"]}
              value={employeeForm.employmentStatus}
              onChange={(value) =>
                setEmployeeForm((current) => ({
                  ...current,
                  employmentStatus: value,
                }))
              }
            />
            <ModalField
              label="Work location"
              value={employeeForm.workLocation}
              onChange={(value) =>
                setEmployeeForm((current) => ({
                  ...current,
                  workLocation: value,
                }))
              }
            />
            <ModalSelect
              label="Profile status"
              options={["ACTIVE", "NEEDS_REVIEW", "ONBOARDING", "INACTIVE"]}
              value={employeeForm.status}
              onChange={(value) =>
                setEmployeeForm((current) => ({
                  ...current,
                  status: value,
                }))
              }
            />
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Reporting manager
              </span>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                onChange={(event) =>
                  setEmployeeForm((current) => ({
                    ...current,
                    manager: event.target.value,
                  }))
                }
                value={employeeForm.manager}
              >
                <option value="">Unassigned</option>
                {departmentManagerOptions
                  .filter((option) => option.fullName !== employeeForm.name)
                  .map((option) => (
                    <option key={option.id} value={option.fullName}>
                      {option.fullName} ({option.employeeCode})
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <ModalActions
            primaryLabel={editingEmployeeRecordId ? "Save employee" : "Create employee"}
            onCancel={() => {
              setEditingEmployeeRecordId(null);
              setIsEmployeeModalOpen(false);
            }}
            onConfirm={() => {
              void submitEmployee();
            }}
          />
        </CenteredModal>
      ) : null}
      {isAttendanceReviewModalOpen ? (
        <CenteredModal
          title="Review attendance entry"
          onClose={() => {
            setReviewingAttendanceId(null);
            setIsAttendanceReviewModalOpen(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalSelect
              label="Review status"
              options={["ON_TIME", "LATE", "MISSING_CLOCK_OUT", "COMPLETE", "FLAGGED"]}
              value={attendanceReviewForm.status}
              onChange={(value) =>
                setAttendanceReviewForm((current) => ({
                  ...current,
                  status: value,
                }))
              }
            />
            <ModalField
              label="Reviewed at"
              value={attendanceReviewForm.reviewedAt}
              onChange={(value) =>
                setAttendanceReviewForm((current) => ({
                  ...current,
                  reviewedAt: value,
                }))
              }
            />
            <ModalField
              label="Time in"
              value={attendanceReviewForm.timeIn}
              onChange={(value) =>
                setAttendanceReviewForm((current) => ({
                  ...current,
                  timeIn: value,
                }))
              }
            />
            <ModalField
              label="Time out"
              value={attendanceReviewForm.timeOut}
              onChange={(value) =>
                setAttendanceReviewForm((current) => ({
                  ...current,
                  timeOut: value,
                }))
              }
            />
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Review remarks
              </span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                onChange={(event) =>
                  setAttendanceReviewForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
                value={attendanceReviewForm.remarks}
              />
            </label>
          </div>
          <ModalActions
            primaryLabel="Save review"
            onCancel={() => {
              setReviewingAttendanceId(null);
              setIsAttendanceReviewModalOpen(false);
            }}
            onConfirm={() => {
              void submitAttendanceReview();
            }}
          />
        </CenteredModal>
      ) : null}
      {isLeaveModalOpen ? (
        <CenteredModal title="Submit leave request" onClose={() => setIsLeaveModalOpen(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Employee" value={leaveForm.employee} />
            <ModalSelect
              label="Leave type"
              options={leaveTypeOptions}
              value={leaveForm.leaveType}
              onChange={(value) => setLeaveForm((current) => ({ ...current, leaveType: value }))}
            />
            <ModalField
              label={isBackendMode ? "Date range (YYYY-MM-DD to YYYY-MM-DD)" : "Date range"}
              value={leaveForm.dates}
              onChange={(value) => setLeaveForm((current) => ({ ...current, dates: value }))}
            />
            <ModalField label="Reason" value={leaveForm.reason} onChange={(value) => setLeaveForm((current) => ({ ...current, reason: value }))} />
          </div>
          <ModalActions
            primaryLabel="Submit request"
            onCancel={() => setIsLeaveModalOpen(false)}
            onConfirm={() => {
              void submitLeaveRequest();
            }}
          />
        </CenteredModal>
      ) : null}
      {isLeavePolicyModalOpen ? (
        <CenteredModal
          title={editingLeavePolicyId ? "Edit leave policy" : "Add leave policy"}
          onClose={() => {
            setEditingLeavePolicyId(null);
            setIsLeavePolicyModalOpen(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField
              label="Policy code"
              value={leavePolicyForm.code}
              onChange={(value) =>
                setLeavePolicyForm((current) => ({
                  ...current,
                  code: value.toUpperCase(),
                }))
              }
            />
            <ModalField
              label="Policy name"
              value={leavePolicyForm.name}
              onChange={(value) =>
                setLeavePolicyForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
            />
            <ModalField
              label="Opening balance"
              value={leavePolicyForm.openingBalance}
              onChange={(value) =>
                setLeavePolicyForm((current) => ({
                  ...current,
                  openingBalance: value,
                }))
              }
            />
            <ModalField
              label="Entitlement"
              value={leavePolicyForm.entitlement}
              onChange={(value) =>
                setLeavePolicyForm((current) => ({
                  ...current,
                  entitlement: value,
                }))
              }
            />
            <ModalSelect
              label="Policy status"
              options={["true", "false"]}
              value={leavePolicyForm.enabled}
              onChange={(value) =>
                setLeavePolicyForm((current) => ({
                  ...current,
                  enabled: value,
                }))
              }
            />
          </div>
          <ModalActions
            primaryLabel={editingLeavePolicyId ? "Save policy" : "Create policy"}
            onCancel={() => {
              setEditingLeavePolicyId(null);
              setIsLeavePolicyModalOpen(false);
            }}
            onConfirm={() => {
              void submitLeavePolicy();
            }}
          />
        </CenteredModal>
      ) : null}
      {isApprovalDecisionModalOpen ? (
        <CenteredModal
          title={approvalDecisionForm.status === "Approved" ? "Approve leave request" : "Reject leave request"}
          onClose={() => {
            setApprovalDecisionRequestId(null);
            setApprovalDecisionForm(defaultApprovalDecisionForm);
            setIsApprovalDecisionModalOpen(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalSelect
              label="Decision"
              options={["Approved", "Rejected"]}
              value={approvalDecisionForm.status}
              onChange={(value) =>
                setApprovalDecisionForm((current) => ({
                  ...current,
                  status: value as "Approved" | "Rejected",
                }))
              }
            />
            <ReadOnlyField label="Request id" value={approvalDecisionRequestId ?? "No request selected"} />
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Reviewer remarks
              </span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                onChange={(event) =>
                  setApprovalDecisionForm((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
                value={approvalDecisionForm.remarks}
              />
            </label>
          </div>
          <ModalActions
            primaryLabel={approvalDecisionForm.status === "Approved" ? "Save approval" : "Save rejection"}
            onCancel={() => {
              setApprovalDecisionRequestId(null);
              setApprovalDecisionForm(defaultApprovalDecisionForm);
              setIsApprovalDecisionModalOpen(false);
            }}
            onConfirm={() => {
              void submitApprovalDecision();
            }}
          />
        </CenteredModal>
      ) : null}
      {isTenantModalOpen ? (
        <CenteredModal title="Edit tenant profile" onClose={() => setIsTenantModalOpen(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Tenant code" value={tenantProfile.code} />
            <ModalField
              label="Tenant name"
              value={tenantForm.name}
              onChange={(value) => setTenantForm((current) => ({ ...current, name: value }))}
            />
            <ModalField
              label="Contact email"
              value={tenantForm.contactEmail}
              onChange={(value) => setTenantForm((current) => ({ ...current, contactEmail: value }))}
            />
            <ModalSelect
              label="Status"
              options={["true", "false"]}
              value={tenantForm.active}
              onChange={(value) => setTenantForm((current) => ({ ...current, active: value }))}
            />
          </div>
          <ModalActions
            primaryLabel="Save tenant"
            onCancel={() => setIsTenantModalOpen(false)}
            onConfirm={() => {
              void submitTenantProfile();
            }}
          />
        </CenteredModal>
      ) : null}
      {isDepartmentModalOpen ? (
        <CenteredModal
          title={editingDepartmentId ? "Edit department" : "Add department"}
          onClose={() => {
            setEditingDepartmentId(null);
            setIsDepartmentModalOpen(false);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField
              label="Department code"
              value={departmentForm.code}
              onChange={(value) => setDepartmentForm((current) => ({ ...current, code: value }))}
            />
            <ModalField
              label="Department name"
              value={departmentForm.name}
              onChange={(value) => setDepartmentForm((current) => ({ ...current, name: value }))}
            />
            <ModalField
              label="Description"
              value={departmentForm.description}
              onChange={(value) => setDepartmentForm((current) => ({ ...current, description: value }))}
            />
            <ModalSelect
              label="Department status"
              options={["true", "false"]}
              value={departmentForm.active}
              onChange={(value) => setDepartmentForm((current) => ({ ...current, active: value }))}
            />
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Department lead
              </span>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                onChange={(event) =>
                  setDepartmentForm((current) => ({
                    ...current,
                    managerEmployeeId: event.target.value,
                  }))
                }
                value={departmentForm.managerEmployeeId}
              >
                <option value="">No lead assigned</option>
                {departmentManagerOptions.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.fullName} ({candidate.employeeCode})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ModalActions
            primaryLabel={editingDepartmentId ? "Save department" : "Create department"}
            onCancel={() => {
              setEditingDepartmentId(null);
              setIsDepartmentModalOpen(false);
            }}
            onConfirm={() => {
              void submitDepartment();
            }}
          />
        </CenteredModal>
      ) : null}
      {isAdminUserModalOpen ? (
        <CenteredModal title="Provision HR Admin access" onClose={() => setIsAdminUserModalOpen(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Employee
              </span>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                onChange={(event) =>
                  setAdminUserForm((current) => ({
                    ...current,
                    employeeId: event.target.value,
                  }))
                }
                value={adminUserForm.employeeId}
              >
                <option value="">Select employee</option>
                {availableAdminCandidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.fullName} ({candidate.employeeCode})
                  </option>
                ))}
              </select>
            </label>
            <ModalField
              label="Temporary password"
              value={adminUserForm.password}
              onChange={(value) => setAdminUserForm((current) => ({ ...current, password: value }))}
            />
            <ModalSelect
              label="Access status"
              options={["true", "false"]}
              value={adminUserForm.active}
              onChange={(value) => setAdminUserForm((current) => ({ ...current, active: value }))}
            />
          </div>
          <ModalActions
            primaryLabel="Save HR Admin"
            onCancel={() => setIsAdminUserModalOpen(false)}
            onConfirm={() => {
              void submitAdminUser();
            }}
          />
        </CenteredModal>
      ) : null}
    </div>
  );
}

function renderModuleContent(
  activeModule: ModuleKey,
  role: Role,
  tenantProfile: TenantProfileRecord,
  departments: DepartmentRecord[],
  adminUsers: AdminUserRecord[],
  adminCandidates: EmployeeOption[],
  filteredEmployees: EmployeeRecord[],
  leavePolicies: LeavePolicyRecord[],
  leaveRequests: LeaveRequest[],
  attendanceItems: AttendanceItem[],
  dashboardCards: Array<{
    title: string;
    value: string;
    note: string;
    icon: typeof BriefcaseBusiness;
    accent: string;
  }>,
  reportSections: ReportSection[],
  auditEntries: AuditEntry[],
  pendingApprovals: LeaveRequest[],
  approvedLeaveCount: number,
  directReportCount: number,
  attendanceIssueCount: number,
  profileSummary: ProfileSummary | null,
  leaveBalances: LeaveBalanceItem[],
  highlightedLeaveBalance: LeaveBalanceItem | null,
  showPopup: (tone: PopupTone, title: string, message: string, debugRef: string) => void,
  updateLeaveStatus: (requestId: string, nextStatus: "Approved" | "Rejected") => void | Promise<void>,
  attendanceHeroTime: string,
  attendanceStatusSummary: string,
  attendancePrimaryLabel: string,
  handleAttendancePrimaryAction: () => void,
  handleAttendanceFlagAction: () => void,
  isAttendanceSubmitting: boolean,
  openTenantModal: () => void,
  openDepartmentModal: () => void,
  openDepartmentEditor: (departmentId: string) => void,
  openAdminUserModal: (employeeId?: string) => void,
  toggleDepartmentState: (department: DepartmentRecord) => void,
  toggleAdminUserState: (adminUser: AdminUserRecord) => void,
  openEmployeeModal: () => void,
  openEmployeeEditor: (employeeId: string) => void,
  openLeavePolicyModal: () => void,
  openLeavePolicyEditor: (leavePolicyId: string) => void,
  openLeaveModal: () => void,
  isBackendMode: boolean,
  openAttendanceReview: (attendanceId: string) => void,
  sessionActor?: string,
) {
  switch (activeModule) {
    case "dashboard":
      return (
        <div className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{card.title}</p>
                      <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
                    </div>
                    <div
                      className={classNames(
                        "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                        card.accent,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{card.note}</p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    {isBackendMode ? "Eleventh build slice" : "Preview sandbox"}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {isBackendMode ? "Live backend sync and role-aware behavior" : "Stored state and role-aware behavior"}
                  </h2>
                </div>
                <button
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                  onClick={() =>
                    showPopup(
                      "success",
                      "Developer checkpoint captured",
                      isBackendMode
                        ? `This preview is running against the live backend session for ${sessionActor ?? "the signed-in user"}.`
                        : "This slice now supports hidden role-based modules plus locally stored employee and leave data.",
                      isBackendMode ? "DEBUG-DASH-BACKEND-04" : "DEBUG-DASH-ROLE-02",
                    )
                  }
                  type="button"
                >
                  Save checkpoint
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <StatusPanel
                  label={reportSections[0]?.metrics[0]?.label ?? "Employees"}
                  value={reportSections[0]?.metrics[0]?.value ?? filteredEmployees.length.toString()}
                  note={reportSections[0]?.metrics[0]?.note ?? "Stored records can be created and searched."}
                />
                <StatusPanel
                  label={reportSections[1]?.metrics[1]?.label ?? "Leave queue"}
                  value={reportSections[1]?.metrics[1]?.value ?? pendingApprovals.length.toString()}
                  note={
                    reportSections[1]?.metrics[1]?.note ??
                    (isBackendMode
                      ? "Approval counts update from the backend queue."
                      : "Approval counts update from saved requests.")
                  }
                />
                <StatusPanel
                  label={isBackendMode ? "Report scope" : "Role access"}
                  value={reportSections[3]?.metrics[2]?.value ?? role}
                  note={reportSections[3]?.metrics[2]?.note ?? "Sidebar visibility now follows the active role."}
                />
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Current role context</p>
              <h2 className="mt-2 text-2xl font-semibold">{role}</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                {roleDescriptions[role]}
              </p>
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-emerald-300" />
                  <p className="text-sm font-medium">Restricted modules are hidden from the sidebar.</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Unauthorized and generic error states can also be triggered from the debug console for QA validation.
                </p>
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                Operational snapshot
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Server-backed reporting highlights
              </h2>
              <div className="mt-6 grid gap-4">
                {(reportSections[0]?.metrics ?? []).map((metric) => (
                  <StatusPanel
                    key={`${reportSections[0]?.id}-${metric.label}`}
                    label={metric.label}
                    note={metric.note}
                    value={metric.value}
                  />
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Recent activity
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Audit-visible workflow trace
              </h2>
              <div className="mt-5 grid gap-3">
                {auditEntries.length ? (
                  auditEntries.map((entry) => (
                    <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {entry.module} - {entry.actionType}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{entry.description}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {entry.actor} - {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600">
                          {entry.targetRecordId}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No audit activity visible"
                    message="Recent traceable actions will appear here once the selected role performs backend workflow activity."
                  />
                )}
              </div>
            </article>
          </section>

          {profileSummary ? (
            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                  {role === "Employee" ? "My profile" : "Profile summary"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {profileSummary.fullName}
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field label="Employee code" value={profileSummary.employeeCode} />
                  <Field label="Job title" value={profileSummary.jobTitle} />
                  <Field label="Department" value={profileSummary.department} />
                  <Field label="Work location" value={profileSummary.workLocation} />
                  <Field label="Manager" value={profileSummary.managerName ?? "Not assigned"} />
                  <Field label="Profile status" value={profileSummary.profileStatus} />
                </div>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  {role === "Manager" ? "Team summary" : "Self-service summary"}
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <DebugChip label="Email" value={profileSummary.email} />
                  <DebugChip
                    label={role === "Manager" ? "Direct reports" : "Report line"}
                    value={
                      role === "Manager"
                        ? directReportCount.toString()
                        : (profileSummary.managerName ?? "No manager assigned")
                    }
                  />
                  <DebugChip
                    label="Pending approvals"
                    value={pendingApprovals.length.toString()}
                  />
                  <DebugChip
                    label="Attendance issues"
                    value={attendanceIssueCount.toString()}
                  />
                </div>
                {highlightedLeaveBalance ? (
                  <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Highlighted balance
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {highlightedLeaveBalance.leaveType}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Remaining: {highlightedLeaveBalance.remainingBalance.toFixed(1)} days
                    </p>
                  </div>
                ) : null}
              </article>
            </section>
          ) : null}
        </div>
      );
    case "organization":
      return (
        <section className="grid gap-6">
          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                    Tenant profile
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Company settings and admin foundation
                  </h2>
                </div>
                {role === "Tenant Admin" ? (
                  <button
                    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                    onClick={openTenantModal}
                    type="button"
                  >
                    Edit tenant
                  </button>
                ) : null}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Tenant code" value={tenantProfile.code} />
                <Field label="Tenant name" value={tenantProfile.name} />
                <Field label="Contact email" value={tenantProfile.contactEmail || "Not set"} />
                <Field label="Status" value={tenantProfile.active ? "Active" : "Paused"} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <StatusPanel
                  label="Departments"
                  value={departments.length.toString()}
                  note="Organization structure for the tenant."
                />
                <StatusPanel
                  label="HR Admin users"
                  value={adminUsers.length.toString()}
                  note="Tenant-scoped admin access accounts."
                />
                <StatusPanel
                  label="Eligible candidates"
                  value={adminCandidates.length.toString()}
                  note="Existing employees available for HR Admin provisioning."
                />
              </div>
              <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                MVP assumption: Tenant Admin provisions HR Admin access for an existing employee
                record using a temporary password. Full invite or email bootstrap flows are deferred.
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Role boundary
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {role === "Tenant Admin" ? "Tenant-wide setup control" : "Organization support visibility"}
              </h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <DebugChip label="Current role" value={role} />
                <DebugChip
                  label="Department edits"
                  value={role === "Employee" || role === "Manager" ? "Not allowed" : "Allowed"}
                />
                <DebugChip
                  label="HR Admin access"
                  value={role === "Tenant Admin" ? "Provision and pause" : "View only"}
                />
                <DebugChip
                  label="Debug mode"
                  value={isBackendMode ? "Backend responses visible" : "Local preview state"}
                />
              </div>
              <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                Tenant Admin owns tenant profile and HR Admin access. HR Admin can support
                department structure within approved MVP scope but cannot grant admin access.
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    Departments
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Organization structure and department leads
                  </h2>
                </div>
                {(role === "Tenant Admin" || role === "HR Admin") ? (
                  <button
                    className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500"
                    onClick={openDepartmentModal}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add department
                    </span>
                  </button>
                ) : null}
              </div>
              <div className="mt-6 grid gap-4">
                {departments.length ? (
                  departments.map((department) => (
                    <article
                      key={department.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{department.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {department.code} - Lead: {department.managerName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {department.employeeCount} mapped employee records
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {department.description || "No department description added yet."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600">
                            {department.active ? "Active" : "Paused"}
                          </span>
                          {(role === "Tenant Admin" || role === "HR Admin") ? (
                            <>
                              <button
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                                onClick={() => openDepartmentEditor(department.id)}
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                                onClick={() => toggleDepartmentState(department)}
                                type="button"
                              >
                                {department.active ? "Pause" : "Activate"}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="No departments yet"
                    message="Add a department to begin the tenant organization structure."
                  />
                )}
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                    HR Admin access
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Tenant-scoped admin provisioning
                  </h2>
                </div>
                {role === "Tenant Admin" ? (
                  <button
                    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                    onClick={() => openAdminUserModal()}
                    type="button"
                  >
                    Provision HR Admin
                  </button>
                ) : null}
              </div>
              <div className="mt-5 grid gap-3">
                {adminUsers.length ? (
                  adminUsers.map((adminUser) => (
                    <div key={adminUser.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{adminUser.employeeName}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {adminUser.employeeCode} - {adminUser.jobTitle}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {adminUser.department} - {adminUser.email}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Last login: {formatDateTime(adminUser.lastLoginAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600">
                            {adminUser.active ? "Active" : "Paused"}
                          </span>
                          {role === "Tenant Admin" ? (
                            <>
                              <button
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                                onClick={() => openAdminUserModal(adminUser.employeeId ?? undefined)}
                                type="button"
                              >
                                Reset access
                              </button>
                              <button
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                                onClick={() => toggleAdminUserState(adminUser)}
                                type="button"
                              >
                                {adminUser.active ? "Pause" : "Activate"}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No HR Admin access yet"
                    message="Provision an employee as an HR Admin to unlock daily HR operations."
                  />
                )}
              </div>
              {role === "Tenant Admin" ? (
                <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Provisioning uses existing employee records only. This MVP slice does not add
                  email invites or standalone admin identities outside the tenant employee list.
                </div>
              ) : null}
            </article>
          </section>
        </section>
      );
    case "employees":
      return (
        <section className="grid gap-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                  {role === "Manager" ? "Direct reports" : "Employee Master"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {role === "Manager"
                    ? "Team profiles limited to your reporting line"
                    : "Employee records with searchable stored state"}
                </h2>
              </div>
              {role !== "Manager" ? (
                <button
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500"
                  onClick={openEmployeeModal}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add employee
                  </span>
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4">
              {filteredEmployees.length ? (
                filteredEmployees.map((employee) => (
                  <article
                    key={employee.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">{employee.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {employee.id} - {employee.title} - {employee.team}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Manager: {employee.manager} - {employee.email}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {employee.employmentStatus ?? "Permanent"} - {employee.workLocation ?? "Kuala Lumpur"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600">{employee.status}</span>
                      {role === "Tenant Admin" || role === "HR Admin" ? (
                        <button
                          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                          onClick={() => openEmployeeEditor(employee.id)}
                          type="button"
                        >
                          Edit record
                        </button>
                      ) : (
                        <button
                          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                          onClick={() =>
                            showPopup(
                              employee.status === "Needs Review" ? "warning" : "success",
                              employee.status === "Needs Review" ? "Record needs review" : "Employee record opened",
                              employee.status === "Needs Review"
                                ? "The selected employee has a data-quality flag. Debug mode keeps the issue reference visible for faster triage."
                                : "This employee card is limited to your direct-report team scope.",
                              `DEBUG-${employee.id}`,
                            )
                          }
                          type="button"
                        >
                          Open record
                        </button>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title={role === "Manager" ? "No direct reports assigned" : "No employee records yet"}
                  message={
                    role === "Manager"
                      ? "Direct-report employee cards will appear here once the reporting line is assigned."
                      : "Create an employee record to populate this module."
                  }
                />
              )}
            </div>
          </section>
        </section>
      );
    case "leave":
      return (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Leave workflow</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {role === "Employee"
                    ? "Leave balance and request history"
                    : role === "Manager"
                      ? "Self-service leave and team approval visibility"
                      : "Stored requests with approval-ready state"}
                </h2>
              </div>
              <button
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                onClick={openLeaveModal}
                type="button"
              >
                Submit leave
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Current actor" value={sessionActor ?? roleUsers[role].employee} />
              <Field label="Visible requests" value={leaveRequests.length.toString()} />
              <Field
                label={role === "Employee" ? "Pending requests" : "Pending approvals"}
                value={pendingApprovals.length.toString()}
              />
              <Field
                label={role === "Employee" ? "Approved history" : "Role access"}
                value={role === "Employee" ? approvedLeaveCount.toString() : role}
              />
            </div>
            {leaveBalances.length ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {leaveBalances.map((balance) => (
                  <StatusPanel
                    key={balance.leaveType}
                    label={balance.leaveType}
                    note={`Used ${balance.usedBalance.toFixed(1)} days, pending ${balance.pendingBalance.toFixed(1)} days.`}
                    value={`${balance.remainingBalance.toFixed(1)} left`}
                  />
                ))}
              </div>
            ) : null}
            <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Leave policy
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Enabled leave types and opening balances
                  </h3>
                </div>
                {(role === "Tenant Admin" || role === "HR Admin") ? (
                  <button
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                    onClick={openLeavePolicyModal}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add policy
                    </span>
                  </button>
                ) : null}
              </div>
              <div className="mt-5 grid gap-3">
                {leavePolicies.length ? (
                  leavePolicies.map((policy) => (
                    <div key={policy.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{policy.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {policy.code} - {policy.enabled ? "Enabled" : "Disabled"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Opening balance {policy.openingBalance.toFixed(1)} days, entitlement{" "}
                            {policy.entitlement.toFixed(1)} days.
                          </p>
                        </div>
                        {(role === "Tenant Admin" || role === "HR Admin") ? (
                          <button
                            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                            onClick={() => openLeavePolicyEditor(policy.id)}
                            type="button"
                          >
                            Edit policy
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No leave policies configured"
                    message="Configure an enabled leave type before new leave requests are submitted."
                  />
                )}
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {isBackendMode
                ? role === "Manager"
                  ? "Leave requests now include your own self-service entries plus direct-report team visibility."
                  : "Leave requests now refresh from the backend and new submissions are written through the API."
                : "Leave requests now persist in local storage, appear in the request list, and can move through approval status updates."}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {role === "Employee" ? "Leave history" : role === "Manager" ? "Recent self and team requests" : "Recent requests"}
            </p>
            <div className="mt-5 grid gap-3">
              {leaveRequests.length ? (
                leaveRequests.map((request) => (
                  <div key={request.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{request.employee}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {request.leaveType} - {request.dates}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{request.reason}</p>
                        {request.approvalRemarks ? (
                          <p className="mt-1 text-sm text-slate-500">
                            Reviewer remarks: {request.approvalRemarks}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600">{request.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No leave requests yet"
                  message="Submit a new leave request to see it appear here with stored workflow state."
                />
              )}
            </div>
          </article>
        </section>
      );
    case "attendance":
      return (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Attendance action</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Simple, traceable attendance capture</h2>
            <div className="mt-6 rounded-[28px] bg-slate-950 p-6 text-white">
              <p className="text-sm text-slate-300">Today</p>
              <p className="mt-2 text-4xl font-semibold">{attendanceHeroTime}</p>
              <p className="mt-3 text-sm text-slate-300">
                Current status: {attendanceStatusSummary}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-200"
                  disabled={isAttendanceSubmitting}
                  onClick={handleAttendancePrimaryAction}
                  type="button"
                >
                  {isAttendanceSubmitting ? "Saving..." : attendancePrimaryLabel}
                </button>
                <button
                  className="rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-400"
                  disabled={isAttendanceSubmitting}
                  onClick={handleAttendanceFlagAction}
                  type="button"
                >
                  Flag exception
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Attendance review</p>
            <div className="mt-5 grid gap-3">
              {attendanceItems.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.employee}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {(item.employeeCode ? `${item.employeeCode} - ` : "") + item.time}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Attendance date: {item.attendanceDate ? formatDate(item.attendanceDate) : "Same-day preview"}
                      </p>
                      {item.remarks ? (
                        <p className="mt-1 text-sm text-slate-500">Remarks: {item.remarks}</p>
                      ) : null}
                      {item.reviewedAt || item.reviewedBy ? (
                        <p className="mt-1 text-sm text-slate-500">
                          Reviewed: {item.reviewedBy ?? "Pending reviewer"}
                          {item.reviewedAt ? ` - ${formatDateTime(item.reviewedAt)}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600">{item.status}</span>
                      {role === "Tenant Admin" || role === "HR Admin" ? (
                        <button
                          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                          onClick={() => openAttendanceReview(item.id)}
                          type="button"
                        >
                          Review entry
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      );
    case "approvals":
      return (
        <section className="grid gap-6">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Approval queue</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Stored pending requests for manager and HR action</h2>
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                {pendingApprovals.length} pending items
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              {pendingApprovals.length ? (
                pendingApprovals.map((request) => (
                  <div key={request.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pending request</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      {request.employee} - {request.leaveType}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {request.dates} - Reason submitted: {request.reason}
                    </p>
                    {request.approvalRemarks ? (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Existing remarks: {request.approvalRemarks}
                      </p>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500"
                        onClick={() => updateLeaveStatus(request.id, "Approved")}
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                        onClick={() => updateLeaveStatus(request.id, "Rejected")}
                        type="button"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No pending approvals"
                  message="Submit a leave request and it will appear here for status changes."
                />
              )}
            </div>
          </article>
        </section>
      );
    case "reports":
      return (
        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Reports</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {isBackendMode ? "Operational insights tied to live backend reporting" : "Operational insights tied to current stored state"}
            </h2>
            <div className="mt-6 grid gap-4">
              {reportSections.map((section) => (
                <div key={section.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {section.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{section.subtitle}</p>
                  <div className="mt-4 grid gap-3">
                    {section.metrics.map((metric) => (
                      <StatusPanel
                        key={`${section.id}-${metric.label}`}
                        label={metric.label}
                        note={metric.note}
                        value={metric.value}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Audit trail</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {isBackendMode ? "Recent audit-visible actions" : "Preview activity references"}
            </h2>
            <div className="mt-5 grid gap-3">
              {auditEntries.length ? (
                auditEntries.map((entry) => (
                  <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {entry.module} - {entry.actionType}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{entry.description}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {entry.actor} - {formatDateTime(entry.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600">
                        {entry.targetRecordId}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No audit entries visible"
                  message="Traceable workflow activity will appear here after backend actions are performed."
                />
              )}
            </div>
          </article>
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] xl:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Reporting notes</p>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-600">
              <li className="rounded-3xl border border-slate-200 bg-slate-50 p-4">Restricted modules are hidden based on the active role.</li>
              <li className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                {isBackendMode
                  ? "Dashboard, reporting, and audit summaries now read from dedicated backend endpoints that respect role scope."
                  : "Employee, leave, and attendance records are stored locally and survive refresh in development review."}
              </li>
              <li className="rounded-3xl border border-slate-200 bg-slate-50 p-4">Unauthorized and generic error states can now be opened intentionally for QA validation.</li>
            </ul>
          </article>
        </section>
      );
    default:
      return <div />;
  }
}

function StatusPanel({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DebugChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function DebugAction({ label, note, onClick }: { label: string; note: string; onClick: () => void }) {
  return (
    <button
      className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-900 hover:bg-white"
      onClick={onClick}
      type="button"
    >
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
    </button>
  );
}

function StateSurface({ overlayState, onDismiss }: { overlayState: OverlayState; onDismiss: () => void }) {
  const isUnauthorized = overlayState === "unauthorized";

  return (
    <section
      className={classNames(
        "mt-6 rounded-[28px] border p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        isUnauthorized ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={classNames(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              isUnauthorized ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700",
            )}
          >
            {isUnauthorized ? <LockKeyhole className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {isUnauthorized ? "Unauthorized state" : "Generic error state"}
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">
              {isUnauthorized ? "Restricted access preview" : "System error preview"}
            </h3>
          </div>
        </div>
        <button
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          onClick={onDismiss}
          type="button"
        >
          Dismiss
        </button>
      </div>
      <p className="mt-5 text-sm leading-7 text-slate-700">
        {isUnauthorized
          ? "This preview confirms the shared unauthorized surface is available for restricted-route testing even though hidden modules are removed from the sidebar."
          : "This preview confirms a shared generic error surface exists for QA validation while backend failure handling is still being built."}
      </p>
      <div className="mt-5 rounded-3xl border border-white/70 bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Debug reference</p>
        <p className="mt-2 font-mono text-sm text-slate-900">
          {isUnauthorized ? "DEBUG-STATE-UNAUTHORIZED-01" : "DEBUG-STATE-GENERIC-01"}
        </p>
      </div>
    </section>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}

function CenteredModal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.26)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Centered modal</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            aria-label="Close modal"
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-900 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function ModalField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function ModalSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <select
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900">{value}</div>
    </div>
  );
}

function ModalActions({
  onCancel,
  onConfirm,
  primaryLabel,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  primaryLabel: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <button
        className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
        onClick={onCancel}
        type="button"
      >
        Cancel
      </button>
      <button
        className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        onClick={onConfirm}
        type="button"
      >
        {primaryLabel}
      </button>
    </div>
  );
}

function FeedbackModal({ popup, onClose }: { popup: Exclude<PopupState, null>; onClose: () => void }) {
  const styles = popupStyles[popup.tone];
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
      <div
        aria-modal="true"
        className={classNames(
          "w-full max-w-xl rounded-[32px] bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.26)] ring-1",
          styles.ring,
        )}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={classNames("flex h-12 w-12 items-center justify-center rounded-2xl", styles.badge)}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{popup.tone}</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">{popup.title}</h3>
            </div>
          </div>
          <button
            aria-label="Close popup"
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-900 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-600">{popup.message}</p>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Debug reference</p>
          <p className="mt-2 font-mono text-sm text-slate-900">{popup.debugRef}</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <button
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            onClick={onClose}
            type="button"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
