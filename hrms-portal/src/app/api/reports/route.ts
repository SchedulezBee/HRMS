import { AppRole, AttendanceStatus, LeaveStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api/session";
import {
  getAttendanceIssueWhere,
  getAttendanceWhere,
  getAuditWhere,
  getLeaveWhere,
  getPendingApprovalWhere,
  getRoleLabel,
  getScopeLabel,
  getVisibleEmployeeCountWhere,
  type SessionScope,
} from "@/lib/hrms/reporting";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  const authResult = await requireSession([
    AppRole.TENANT_ADMIN,
    AppRole.HR_ADMIN,
    AppRole.MANAGER,
    AppRole.EMPLOYEE,
  ]);

  if (authResult.error) {
    return authResult.error;
  }

  const scope: SessionScope = {
    id: authResult.session.user.id,
    role: authResult.session.user.role,
    tenantId: authResult.session.user.tenantId,
    employeeId: authResult.session.user.employeeId ?? null,
  };

  const leaveWhere = getLeaveWhere(scope);

  const [
    visibleEmployeeCount,
    departmentCount,
    hrAdminCount,
    visibleLeaveCount,
    pendingApprovalCount,
    approvedLeaveCount,
    rejectedLeaveCount,
    attendanceRecordCount,
    attendanceIssueCount,
    completeAttendanceCount,
    auditCount,
  ] = await Promise.all([
    prisma.employee.count({
      where: getVisibleEmployeeCountWhere(scope),
    }),
    scope.role === AppRole.TENANT_ADMIN || scope.role === AppRole.HR_ADMIN
      ? prisma.department.count({
          where: { tenantId: scope.tenantId },
        })
      : Promise.resolve(0),
    scope.role === AppRole.TENANT_ADMIN || scope.role === AppRole.HR_ADMIN
      ? prisma.userAccount.count({
          where: {
            tenantId: scope.tenantId,
            role: AppRole.HR_ADMIN,
          },
        })
      : Promise.resolve(0),
    prisma.leaveRequest.count({
      where: leaveWhere,
    }),
    prisma.leaveRequest.count({
      where: getPendingApprovalWhere(scope),
    }),
    prisma.leaveRequest.count({
      where: {
        ...leaveWhere,
        status: LeaveStatus.APPROVED,
      },
    }),
    prisma.leaveRequest.count({
      where: {
        ...leaveWhere,
        status: LeaveStatus.REJECTED,
      },
    }),
    prisma.attendanceRecord.count({
      where: getAttendanceWhere(scope),
    }),
    prisma.attendanceRecord.count({
      where: getAttendanceIssueWhere(scope),
    }),
    prisma.attendanceRecord.count({
      where: {
        ...getAttendanceWhere(scope),
        status: { in: [AttendanceStatus.ON_TIME, AttendanceStatus.COMPLETE] },
      },
    }),
    prisma.auditLog.count({
      where: getAuditWhere(scope),
    }),
  ]);

  const sections: ReportSection[] = [
    {
      id: "workforce",
      title: "Workforce scope",
      subtitle: `${getRoleLabel(scope.role)} reporting surface`,
      metrics: [
        {
          label: scope.role === AppRole.MANAGER ? "Direct reports" : scope.role === AppRole.EMPLOYEE ? "My profile" : "Visible employees",
          value: visibleEmployeeCount.toString(),
          note:
            scope.role === AppRole.MANAGER
              ? "Restricted to the active reporting line."
              : scope.role === AppRole.EMPLOYEE
                ? "Limited to the signed-in employee profile."
                : "Tenant-scoped employee visibility.",
        },
        {
          label: scope.role === AppRole.TENANT_ADMIN || scope.role === AppRole.HR_ADMIN ? "Departments" : "Scope",
          value:
            scope.role === AppRole.TENANT_ADMIN || scope.role === AppRole.HR_ADMIN
              ? departmentCount.toString()
              : getScopeLabel(scope),
          note:
            scope.role === AppRole.TENANT_ADMIN || scope.role === AppRole.HR_ADMIN
              ? "Current organization-structure coverage."
              : "Role boundary applied to reporting output.",
        },
        {
          label: scope.role === AppRole.TENANT_ADMIN || scope.role === AppRole.HR_ADMIN ? "HR Admin users" : "Audit events",
          value:
            scope.role === AppRole.TENANT_ADMIN || scope.role === AppRole.HR_ADMIN
              ? hrAdminCount.toString()
              : auditCount.toString(),
          note:
            scope.role === AppRole.TENANT_ADMIN || scope.role === AppRole.HR_ADMIN
              ? "Provisioned operations accounts in tenant scope."
              : "Recent traceable actions for this role scope.",
        },
      ],
    },
    {
      id: "leave",
      title: "Leave operations",
      subtitle: "Workflow volume and approval health",
      metrics: [
        {
          label: "Visible leave",
          value: visibleLeaveCount.toString(),
          note: "Includes only records allowed by the current role scope.",
        },
        {
          label: scope.role === AppRole.EMPLOYEE ? "Pending requests" : "Pending approvals",
          value: pendingApprovalCount.toString(),
          note:
            scope.role === AppRole.MANAGER
              ? "Manager queue excludes requests outside the direct-report team."
              : "Pending items remain traceable in MVP workflow state.",
        },
        {
          label: "Approved history",
          value: approvedLeaveCount.toString(),
          note: `Rejected items currently visible: ${rejectedLeaveCount}.`,
        },
      ],
    },
    {
      id: "attendance",
      title: "Attendance operations",
      subtitle: "Basic attendance monitoring and exception review",
      metrics: [
        {
          label: "Visible records",
          value: attendanceRecordCount.toString(),
          note: "Attendance reporting remains scoped by role and tenant.",
        },
        {
          label: "Attendance issues",
          value: attendanceIssueCount.toString(),
          note:
            scope.role === AppRole.MANAGER
              ? "Issue totals are limited to direct-report exception records."
              : "Late, flagged, and missing clock-out entries are counted here.",
        },
        {
          label: "Complete entries",
          value: completeAttendanceCount.toString(),
          note: "Useful for quick operational health checks in MVP reporting.",
        },
      ],
    },
    {
      id: "audit",
      title: "Audit visibility",
      subtitle: "Traceability and development-time visibility",
      metrics: [
        {
          label: "Audit events",
          value: auditCount.toString(),
          note: "Audit visibility respects the current role boundary.",
        },
        {
          label: "Debug mode",
          value: "Enabled",
          note: "Errors and validation issues stay traceable during development.",
        },
        {
          label: "Report scope",
          value: getScopeLabel(scope),
          note: "The same scope rules are applied to dashboard, reports, and audit surfaces.",
        },
      ],
    },
  ];

  return NextResponse.json({ items: sections });
}
