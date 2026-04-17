import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { employeeUpdateSchema } from "@/lib/validation/hrms";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = employeeUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Employee update payload is invalid.",
        debugRef: "DEBUG-API-EMPLOYEE-UPDATE-VALIDATION",
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const existing = await prisma.employee.findFirst({
    where: {
      id,
      tenantId: authResult.session.user.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        title: "Employee not found",
        message: "The selected employee could not be found for this tenant.",
        debugRef: "DEBUG-API-EMPLOYEE-UPDATE-NOTFOUND",
      },
      { status: 404 },
    );
  }

  if (parsed.data.managerId) {
    const manager = await prisma.employee.findFirst({
      where: {
        id: parsed.data.managerId,
        tenantId: authResult.session.user.tenantId,
      },
      select: { id: true },
    });

    if (!manager) {
      return NextResponse.json(
        {
          title: "Manager not found",
          message: "The selected reporting manager is not valid for this tenant.",
          debugRef: "DEBUG-API-EMPLOYEE-UPDATE-MANAGER",
        },
        { status: 400 },
      );
    }
  }

  const existingEmail = await prisma.employee.findFirst({
    where: {
      tenantId: authResult.session.user.tenantId,
      email: parsed.data.email,
      NOT: {
        id: existing.id,
      },
    },
    select: { id: true },
  });

  if (existingEmail) {
    return NextResponse.json(
      {
        title: "Email conflict",
        message: "Another employee already uses this email inside the current tenant.",
        debugRef: "DEBUG-API-EMPLOYEE-UPDATE-EMAIL",
      },
      { status: 400 },
    );
  }

  const updatedEmployee = await prisma.employee.update({
    where: { id: existing.id },
    data: {
      fullName: parsed.data.fullName,
      preferredName: parsed.data.preferredName?.trim() || null,
      email: parsed.data.email,
      phoneNumber: parsed.data.phoneNumber?.trim() || null,
      identityNumber: parsed.data.identityNumber?.trim() || null,
      employmentStatus: parsed.data.employmentStatus,
      department: parsed.data.department,
      jobTitle: parsed.data.jobTitle,
      managerId: parsed.data.managerId === undefined ? existing.managerId : parsed.data.managerId,
      hireDate:
        parsed.data.hireDate === undefined
          ? existing.hireDate
          : parsed.data.hireDate
            ? new Date(parsed.data.hireDate)
            : null,
      workLocation: parsed.data.workLocation?.trim() || null,
      profileStatus: parsed.data.profileStatus,
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: authResult.session.user.tenantId,
    actorUserId: authResult.session.user.id,
    module: "Employee",
    actionType: "UPDATE",
    targetRecordId: updatedEmployee.id,
    beforeValue: existing,
    afterValue: updatedEmployee,
  });

  return NextResponse.json({
    title: "Employee updated",
    message: "Employee profile changes were stored successfully.",
    debugRef: `DEBUG-API-EMPLOYEE-${updatedEmployee.id}`,
    item: updatedEmployee,
  });
}
