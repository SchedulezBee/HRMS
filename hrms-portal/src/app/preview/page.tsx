import { AppRole } from "@prisma/client";
import { auth } from "@/auth";
import { HrmsPortal } from "@/components/hrms-portal";
import { prisma } from "@/lib/prisma";

function mapRole(role: AppRole) {
  switch (role) {
    case AppRole.TENANT_ADMIN:
      return "Tenant Admin" as const;
    case AppRole.HR_ADMIN:
      return "HR Admin" as const;
    case AppRole.MANAGER:
      return "Manager" as const;
    case AppRole.EMPLOYEE:
      return "Employee" as const;
  }
}

export default async function PreviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <HrmsPortal />;
  }

  const [tenant, employee] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { code: true },
    }),
    session.user.employeeId
      ? prisma.employee.findUnique({
          where: { id: session.user.employeeId },
          select: { fullName: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <HrmsPortal
      session={{
        email: session.user.email ?? "",
        employee: employee?.fullName ?? "Tenant Admin",
        employeeId: session.user.employeeId ?? null,
        role: mapRole(session.user.role),
        tenantCode: tenant?.code ?? "COREVISION",
      }}
    />
  );
}
