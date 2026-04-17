import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { departmentCreateSchema } from "@/lib/validation/hrms";

export async function GET() {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const [items, managerCandidates, employeeCounts] = await Promise.all([
    prisma.department.findMany({
      where: { tenantId: authResult.session.user.tenantId },
      include: {
        managerEmployee: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    prisma.employee.findMany({
      where: {
        tenantId: authResult.session.user.tenantId,
        profileStatus: "ACTIVE",
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        jobTitle: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.employee.groupBy({
      by: ["department"],
      where: { tenantId: authResult.session.user.tenantId },
      _count: {
        _all: true,
      },
    }),
  ]);

  const employeeCountMap = new Map(
    employeeCounts.map((item) => [item.department, item._count._all]),
  );

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      employeeCount: employeeCountMap.get(item.name) ?? 0,
    })),
    managerCandidates,
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = departmentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Department payload is invalid.",
        debugRef: "DEBUG-API-DEPARTMENT-VALIDATION",
      },
      { status: 400 },
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

  const created = await prisma.department.create({
    data: {
      active: parsed.data.active,
      code: parsed.data.code.trim().toUpperCase(),
      description: parsed.data.description?.trim() || null,
      managerEmployeeId: parsed.data.managerEmployeeId || null,
      name: parsed.data.name.trim(),
      tenantId: authResult.session.user.tenantId,
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

  await writeAuditLog({
    prisma,
    tenantId: authResult.session.user.tenantId,
    actorUserId: authResult.session.user.id,
    module: "Department",
    actionType: "CREATE",
    targetRecordId: created.id,
    afterValue: created,
  });

  return NextResponse.json(
    {
      title: "Department created",
      message: "Department structure was stored successfully.",
      debugRef: `DEBUG-API-DEPARTMENT-${created.id}`,
      item: created,
    },
    { status: 201 },
  );
}
