import { AppRole, LeaveStatus } from "@prisma/client";
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

  const [
    visibleEmployeeCount,
    departmentCount,
    hrAdminCount,
    pendingApprovalCount,
    approvedLeaveCount,
    visibleLeaveCount,
    attendanceRecordCount,
    attendanceIssueCount,
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
      where: getPendingApprovalWhere(scope),
    }),
    prisma.leaveRequest.count({
      where: {
        ...getLeaveWhere(scope),
        status: LeaveStatus.APPROVED,
      },
    }),
    prisma.leaveRequest.count({
      where: getLeaveWhere(scope),
    }),
    prisma.attendanceRecord.count({
      where: getAttendanceWhere(scope),
    }),
    prisma.attendanceRecord.count({
      where: getAttendanceIssueWhere(scope),
    }),
    prisma.auditLog.count({
      where: getAuditWhere(scope),
    }),
  ]);

  return NextResponse.json({
    item: {
      roleLabel: getRoleLabel(scope.role),
      scopeLabel: getScopeLabel(scope),
      visibleEmployeeCount,
      departmentCount,
      hrAdminCount,
      pendingApprovalCount,
      approvedLeaveCount,
      visibleLeaveCount,
      attendanceRecordCount,
      attendanceIssueCount,
      auditCount,
    },
  });
}
