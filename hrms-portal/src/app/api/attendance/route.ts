import { AppRole, AttendanceStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { attendanceRecordSchema } from "@/lib/validation/hrms";

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

  const items = await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: {
        select: {
          fullName: true,
          employeeCode: true,
        },
      },
      reviewedBy: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { attendanceDate: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSession([
    AppRole.TENANT_ADMIN,
    AppRole.HR_ADMIN,
    AppRole.MANAGER,
    AppRole.EMPLOYEE,
  ]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = attendanceRecordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Attendance payload is invalid.",
        debugRef: "DEBUG-API-ATTENDANCE-VALIDATION",
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
        message: "This role may only create attendance records for its own linked employee profile.",
        debugRef: "DEBUG-API-ATTENDANCE-SELF",
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
        message: "Tenant or employee context is invalid for this attendance entry.",
        debugRef: "DEBUG-API-ATTENDANCE-CONTEXT",
      },
      { status: 400 },
    );
  }

  const attendanceRecord = await prisma.attendanceRecord.upsert({
    where: {
      tenantId_employeeId_attendanceDate: {
        tenantId: tenant.id,
        employeeId: employee.id,
        attendanceDate: new Date(parsed.data.attendanceDate),
      },
    },
    update: {
      timeIn: parsed.data.timeIn ? new Date(parsed.data.timeIn) : null,
      timeOut: parsed.data.timeOut ? new Date(parsed.data.timeOut) : null,
      status: parsed.data.status as AttendanceStatus,
      remarks: parsed.data.remarks,
      reviewedByUserId:
        authResult.session.user.role === AppRole.EMPLOYEE ? undefined : authResult.session.user.id,
      reviewedAt: authResult.session.user.role === AppRole.EMPLOYEE ? undefined : new Date(),
    },
    create: {
      tenantId: tenant.id,
      employeeId: employee.id,
      attendanceDate: new Date(parsed.data.attendanceDate),
      timeIn: parsed.data.timeIn ? new Date(parsed.data.timeIn) : null,
      timeOut: parsed.data.timeOut ? new Date(parsed.data.timeOut) : null,
      status: parsed.data.status as AttendanceStatus,
      remarks: parsed.data.remarks,
      reviewedByUserId:
        authResult.session.user.role === AppRole.EMPLOYEE ? undefined : authResult.session.user.id,
      reviewedAt: authResult.session.user.role === AppRole.EMPLOYEE ? undefined : new Date(),
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: tenant.id,
    actorUserId: authResult.session.user.id,
    module: "Attendance",
    actionType: "UPSERT",
    targetRecordId: attendanceRecord.id,
    afterValue: attendanceRecord,
  });

  return NextResponse.json({
    title: "Attendance stored",
    message: "Attendance record was stored successfully.",
    debugRef: `DEBUG-API-ATTENDANCE-${attendanceRecord.id}`,
    item: attendanceRecord,
  });
}
