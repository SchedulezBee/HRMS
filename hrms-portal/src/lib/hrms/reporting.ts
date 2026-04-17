import {
  AppRole,
  AttendanceStatus,
  LeaveStatus,
  Prisma,
} from "@prisma/client";

export type SessionScope = {
  id: string;
  role: AppRole;
  tenantId: string;
  employeeId: string | null;
};

const attendanceIssueStatuses = [
  AttendanceStatus.LATE,
  AttendanceStatus.MISSING_CLOCK_OUT,
  AttendanceStatus.FLAGGED,
] as const;

export function getEmployeeWhere(scope: SessionScope): Prisma.EmployeeWhereInput {
  if (scope.role === AppRole.MANAGER && scope.employeeId) {
    return {
      tenantId: scope.tenantId,
      managerId: scope.employeeId,
    };
  }

  return { tenantId: scope.tenantId };
}

export function getVisibleEmployeeCountWhere(scope: SessionScope): Prisma.EmployeeWhereInput {
  if (scope.role === AppRole.EMPLOYEE && scope.employeeId) {
    return {
      tenantId: scope.tenantId,
      id: scope.employeeId,
    };
  }

  return getEmployeeWhere(scope);
}

export function getLeaveWhere(scope: SessionScope): Prisma.LeaveRequestWhereInput {
  if (scope.role === AppRole.EMPLOYEE && scope.employeeId) {
    return {
      tenantId: scope.tenantId,
      employeeId: scope.employeeId,
    };
  }

  if (scope.role === AppRole.MANAGER && scope.employeeId) {
    return {
      tenantId: scope.tenantId,
      OR: [
        { employeeId: scope.employeeId },
        {
          employee: {
            managerId: scope.employeeId,
          },
        },
      ],
    };
  }

  return { tenantId: scope.tenantId };
}

export function getPendingApprovalWhere(scope: SessionScope): Prisma.LeaveRequestWhereInput {
  if (scope.role === AppRole.EMPLOYEE && scope.employeeId) {
    return {
      tenantId: scope.tenantId,
      employeeId: scope.employeeId,
      status: LeaveStatus.PENDING,
    };
  }

  if (scope.role === AppRole.MANAGER && scope.employeeId) {
    return {
      tenantId: scope.tenantId,
      status: LeaveStatus.PENDING,
      employee: {
        managerId: scope.employeeId,
      },
    };
  }

  return {
    tenantId: scope.tenantId,
    status: LeaveStatus.PENDING,
  };
}

export function getAttendanceWhere(scope: SessionScope): Prisma.AttendanceRecordWhereInput {
  if (scope.role === AppRole.EMPLOYEE && scope.employeeId) {
    return {
      tenantId: scope.tenantId,
      employeeId: scope.employeeId,
    };
  }

  if (scope.role === AppRole.MANAGER && scope.employeeId) {
    return {
      tenantId: scope.tenantId,
      OR: [
        { employeeId: scope.employeeId },
        {
          employee: {
            managerId: scope.employeeId,
          },
        },
      ],
    };
  }

  return { tenantId: scope.tenantId };
}

export function getAttendanceIssueWhere(scope: SessionScope): Prisma.AttendanceRecordWhereInput {
  if (scope.role === AppRole.MANAGER && scope.employeeId) {
    return {
      tenantId: scope.tenantId,
      employee: {
        managerId: scope.employeeId,
      },
      status: {
        in: [...attendanceIssueStatuses],
      },
    };
  }

  return {
    ...getAttendanceWhere(scope),
    status: {
      in: [...attendanceIssueStatuses],
    },
  };
}

export function getAuditWhere(scope: SessionScope): Prisma.AuditLogWhereInput {
  if (scope.role === AppRole.TENANT_ADMIN || scope.role === AppRole.HR_ADMIN) {
    return { tenantId: scope.tenantId };
  }

  return {
    tenantId: scope.tenantId,
    actorUserId: scope.id,
  };
}

export function getRoleLabel(role: AppRole) {
  switch (role) {
    case AppRole.TENANT_ADMIN:
      return "Tenant Admin";
    case AppRole.HR_ADMIN:
      return "HR Admin";
    case AppRole.MANAGER:
      return "Manager";
    case AppRole.EMPLOYEE:
      return "Employee";
  }
}

export function getScopeLabel(scope: SessionScope) {
  if (scope.role === AppRole.TENANT_ADMIN) {
    return "Tenant-wide setup and reporting scope";
  }

  if (scope.role === AppRole.HR_ADMIN) {
    return "Tenant-wide HR operations scope";
  }

  if (scope.role === AppRole.MANAGER) {
    return "Self plus direct-report visibility";
  }

  return "Self-service visibility only";
}

export function formatAuditDescription(module: string, actionType: string, targetRecordId: string) {
  return `${module} ${actionType.toLowerCase()} recorded for ${targetRecordId}.`;
}
