import { AppRole, AttendanceStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { attendanceReviewSchema } from "@/lib/validation/hrms";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = attendanceReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Attendance review payload is invalid.",
        debugRef: "DEBUG-API-ATTENDANCE-REVIEW-VALIDATION",
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const existing = await prisma.attendanceRecord.findFirst({
    where: {
      id,
      tenantId: authResult.session.user.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        title: "Attendance record not found",
        message: "The selected attendance record could not be found for this tenant.",
        debugRef: "DEBUG-API-ATTENDANCE-REVIEW-NOTFOUND",
      },
      { status: 404 },
    );
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status as AttendanceStatus,
      timeIn:
        parsed.data.timeIn === undefined
          ? existing.timeIn
          : parsed.data.timeIn
            ? new Date(parsed.data.timeIn)
            : null,
      timeOut:
        parsed.data.timeOut === undefined
          ? existing.timeOut
          : parsed.data.timeOut
            ? new Date(parsed.data.timeOut)
            : null,
      remarks: parsed.data.remarks === undefined ? existing.remarks : parsed.data.remarks,
      reviewedAt: parsed.data.reviewedAt ? new Date(parsed.data.reviewedAt) : new Date(),
      reviewedByUserId: authResult.session.user.id,
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: authResult.session.user.tenantId,
    actorUserId: authResult.session.user.id,
    module: "Attendance",
    actionType: "REVIEW",
    targetRecordId: updated.id,
    beforeValue: existing,
    afterValue: updated,
  });

  return NextResponse.json({
    title: "Attendance reviewed",
    message: "Attendance review changes were stored successfully.",
    debugRef: `DEBUG-API-ATTENDANCE-REVIEW-${updated.id}`,
    item: updated,
  });
}
