import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { employeeCreateSchema } from "@/lib/validation/hrms";

export async function GET() {
  const authResult = await requireSession([
    AppRole.TENANT_ADMIN,
    AppRole.HR_ADMIN,
    AppRole.MANAGER,
  ]);

  if (authResult.error) {
    return authResult.error;
  }

  const where =
    authResult.session.user.role === AppRole.MANAGER && authResult.session.user.employeeId
      ? {
          tenantId: authResult.session.user.tenantId,
          managerId: authResult.session.user.employeeId,
        }
      : { tenantId: authResult.session.user.tenantId };

  const employees = await prisma.employee.findMany({
    where,
    include: {
      manager: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: employees });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = employeeCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Employee payload is invalid.",
        debugRef: "DEBUG-API-EMPLOYEE-VALIDATION",
      },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { code: parsed.data.tenantCode },
  });

  if (!tenant || tenant.id !== authResult.session.user.tenantId) {
    return NextResponse.json(
      {
        title: "Tenant mismatch",
        message: "The provided tenant context is not valid for the current session.",
        debugRef: "DEBUG-API-EMPLOYEE-TENANT",
      },
      { status: 400 },
    );
  }

  const createdEmployee = await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      employeeCode: parsed.data.employeeCode,
      fullName: parsed.data.fullName,
      preferredName: parsed.data.preferredName,
      email: parsed.data.email,
      phoneNumber: parsed.data.phoneNumber,
      identityNumber: parsed.data.identityNumber,
      employmentStatus: parsed.data.employmentStatus,
      department: parsed.data.department,
      jobTitle: parsed.data.jobTitle,
      managerId: parsed.data.managerId,
      hireDate: parsed.data.hireDate ? new Date(parsed.data.hireDate) : undefined,
      workLocation: parsed.data.workLocation,
      profileStatus: parsed.data.profileStatus,
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: tenant.id,
    actorUserId: authResult.session.user.id,
    module: "Employee",
    actionType: "CREATE",
    targetRecordId: createdEmployee.id,
    afterValue: createdEmployee,
  });

  return NextResponse.json(
    {
      title: "Employee created",
      message: "Employee record was stored successfully.",
      debugRef: `DEBUG-API-EMPLOYEE-${createdEmployee.id}`,
      item: createdEmployee,
    },
    { status: 201 },
  );
}
