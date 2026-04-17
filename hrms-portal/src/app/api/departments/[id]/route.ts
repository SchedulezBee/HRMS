import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { departmentUpdateSchema } from "@/lib/validation/hrms";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = departmentUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Department update payload is invalid.",
        debugRef: "DEBUG-API-DEPARTMENT-UPDATE-VALIDATION",
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const existing = await prisma.department.findFirst({
    where: {
      id,
      tenantId: authResult.session.user.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        title: "Department not found",
        message: "The selected department could not be found.",
        debugRef: "DEBUG-API-DEPARTMENT-NOTFOUND",
      },
      { status: 404 },
    );
  }

  if (parsed.data.managerEmployeeId) {
    const managerEmployee = await prisma.employee.findFirst({
      where: {
        id: parsed.data.managerEmployeeId,
        tenantId: authResult.session.user.tenantId,
      },
      select: { id: true },
    });

    if (!managerEmployee) {
      return NextResponse.json(
        {
          title: "Manager not found",
          message: "The selected department lead is not valid for this tenant.",
          debugRef: "DEBUG-API-DEPARTMENT-MANAGER",
        },
        { status: 400 },
      );
    }
  }

  const nextName = parsed.data.name?.trim() ?? existing.name;
  const nextCode = parsed.data.code?.trim().toUpperCase() ?? existing.code;

  const updated = await prisma.$transaction(async (transaction) => {
    const department = await transaction.department.update({
      where: { id: existing.id },
      data: {
        active: parsed.data.active,
        code: nextCode,
        description:
          parsed.data.description === undefined ? existing.description : parsed.data.description?.trim() || null,
        managerEmployeeId:
          parsed.data.managerEmployeeId === undefined
            ? existing.managerEmployeeId
            : parsed.data.managerEmployeeId,
        name: nextName,
      },
      include: {
        managerEmployee: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    if (existing.name !== nextName) {
      await transaction.employee.updateMany({
        where: {
          tenantId: authResult.session.user.tenantId,
          department: existing.name,
        },
        data: {
          department: nextName,
        },
      });
    }

    return department;
  });

  await writeAuditLog({
    prisma,
    tenantId: authResult.session.user.tenantId,
    actorUserId: authResult.session.user.id,
    module: "Department",
    actionType: "UPDATE",
    targetRecordId: updated.id,
    beforeValue: existing,
    afterValue: updated,
  });

  return NextResponse.json({
    title: "Department updated",
    message: "Department changes were stored successfully.",
    debugRef: `DEBUG-API-DEPARTMENT-${updated.id}`,
    item: updated,
  });
}
