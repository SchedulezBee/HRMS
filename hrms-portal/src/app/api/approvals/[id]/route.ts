import { AppRole, LeaveStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { leaveApprovalSchema } from "@/lib/validation/hrms";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN, AppRole.MANAGER]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = leaveApprovalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Approval payload is invalid.",
        debugRef: "DEBUG-API-APPROVAL-VALIDATION",
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const existing = await prisma.leaveRequest.findFirst({
    where: { id, tenantId: authResult.session.user.tenantId },
    include: {
      employee: {
        select: {
          managerId: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        title: "Not found",
        message: "The requested leave approval item could not be found.",
        debugRef: "DEBUG-API-APPROVAL-NOTFOUND",
      },
      { status: 404 },
    );
  }

  if (
    authResult.session.user.role === AppRole.MANAGER &&
    existing.employee.managerId !== authResult.session.user.employeeId
  ) {
    return NextResponse.json(
      {
        title: "Forbidden",
        message: "Managers may only approve leave requests for their direct reports.",
        debugRef: "DEBUG-API-APPROVAL-SCOPE",
      },
      { status: 403 },
    );
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: parsed.data.status === "APPROVED" ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
      approvalRemarks: parsed.data.approvalRemarks?.trim() || null,
      actedAt: new Date(),
      approverUserId: authResult.session.user.id,
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: authResult.session.user.tenantId,
    actorUserId: authResult.session.user.id,
    module: "Approval",
    actionType: parsed.data.status,
    targetRecordId: updated.id,
    beforeValue: existing,
    afterValue: updated,
  });

  return NextResponse.json({
    title: parsed.data.status === "APPROVED" ? "Request approved" : "Request rejected",
    message: "Approval state has been updated successfully.",
    debugRef: `DEBUG-API-APPROVAL-${updated.id}`,
    item: updated,
  });
}
