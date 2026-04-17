import { AppRole, LeaveStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { leaveRequestCreateSchema } from "@/lib/validation/hrms";

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

  const where =
    authResult.session.user.role === AppRole.EMPLOYEE && authResult.session.user.employeeId
      ? {
          tenantId: authResult.session.user.tenantId,
          employeeId: authResult.session.user.employeeId,
        }
      : authResult.session.user.role === AppRole.MANAGER && authResult.session.user.employeeId
        ? {
            tenantId: authResult.session.user.tenantId,
            OR: [
              { employeeId: authResult.session.user.employeeId },
              {
                employee: {
                  managerId: authResult.session.user.employeeId,
                },
              },
            ],
          }
      : { tenantId: authResult.session.user.tenantId };

  const items = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          fullName: true,
          employeeCode: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSession([AppRole.HR_ADMIN, AppRole.MANAGER, AppRole.EMPLOYEE]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = leaveRequestCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Leave request payload is invalid.",
        debugRef: "DEBUG-API-LEAVE-VALIDATION",
      },
      { status: 400 },
    );
  }

  if (
    (authResult.session.user.role === AppRole.EMPLOYEE ||
      authResult.session.user.role === AppRole.MANAGER) &&
    authResult.session.user.employeeId !== parsed.data.employeeId
  ) {
    return NextResponse.json(
      {
        title: "Forbidden",
        message: "This role may only submit leave requests for its own linked employee profile.",
        debugRef: "DEBUG-API-LEAVE-SELF",
      },
      { status: 403 },
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { code: parsed.data.tenantCode } });
  const employee = await prisma.employee.findFirst({
    where: { id: parsed.data.employeeId, tenantId: authResult.session.user.tenantId },
  });

  if (!tenant || !employee || tenant.id !== authResult.session.user.tenantId) {
    return NextResponse.json(
      {
        title: "Context mismatch",
        message: "Tenant or employee context is invalid for this leave request.",
        debugRef: "DEBUG-API-LEAVE-CONTEXT",
      },
      { status: 400 },
    );
  }

  const leavePolicy = await prisma.leavePolicy.findFirst({
    where: {
      tenantId: tenant.id,
      name: parsed.data.leaveType,
    },
  });

  if (!leavePolicy?.enabled) {
    return NextResponse.json(
      {
        title: "Leave type unavailable",
        message: "This leave type is not enabled for the current tenant policy setup.",
        debugRef: "DEBUG-API-LEAVE-POLICY",
      },
      { status: 400 },
    );
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      tenantId: tenant.id,
      employeeId: employee.id,
      leaveType: parsed.data.leaveType,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      totalDays: parsed.data.totalDays,
      reason: parsed.data.reason,
      status: LeaveStatus.PENDING,
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: tenant.id,
    actorUserId: authResult.session.user.id,
    module: "LeaveRequest",
    actionType: "CREATE",
    targetRecordId: leaveRequest.id,
    afterValue: leaveRequest,
  });

  return NextResponse.json(
    {
      title: "Leave request submitted",
      message: "Leave request was stored and is now pending approval.",
      debugRef: `DEBUG-API-LEAVE-${leaveRequest.id}`,
      item: leaveRequest,
    },
    { status: 201 },
  );
}
