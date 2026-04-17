import { AppRole } from "@prisma/client";

export const roleLabels: Record<AppRole, string> = {
  TENANT_ADMIN: "Tenant Admin",
  HR_ADMIN: "HR Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

export function hasAnyRole(userRole: AppRole | undefined, allowedRoles: AppRole[]) {
  return Boolean(userRole && allowedRoles.includes(userRole));
}
