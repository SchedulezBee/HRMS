import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { leavePolicyUpdateSchema } from "@/lib/validation/hrms";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = leavePolicyUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Leave policy update payload is invalid.",
        debugRef: "DEBUG-API-LEAVE-TYPE-UPDATE-VALIDATION",
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const existing = await prisma.leavePolicy.findFirst({
    where: {
      id,
      tenantId: authResult.session.user.tenantId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        title: "Not found",
        message: "The requested leave policy could not be found.",
        debugRef: "DEBUG-API-LEAVE-TYPE-NOTFOUND",
      },
      { status: 404 },
    );
  }

  const nextCode = parsed.data.code?.trim().toUpperCase() ?? existing.code;
  const nextName = parsed.data.name?.trim() ?? existing.name;

  const duplicate = await prisma.leavePolicy.findFirst({
    where: {
      tenantId: authResult.session.user.tenantId,
      id: { not: existing.id },
      OR: [{ code: nextCode }, { name: nextName }],
    },
  });

  if (duplicate) {
    return NextResponse.json(
      {
        title: "Leave policy already exists",
        message: "Leave policy code and name must remain unique within the tenant.",
        debugRef: "DEBUG-API-LEAVE-TYPE-UPDATE-DUPLICATE",
      },
      { status: 409 },
    );
  }

  const updated = await prisma.leavePolicy.update({
    where: { id: existing.id },
    data: {
      code: nextCode,
      enabled: parsed.data.enabled ?? existing.enabled,
      entitlement: parsed.data.entitlement ?? existing.entitlement,
      name: nextName,
      openingBalance: parsed.data.openingBalance ?? existing.openingBalance,
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: authResult.session.user.tenantId,
    actorUserId: authResult.session.user.id,
    module: "LeavePolicy",
    actionType: "UPDATE",
    targetRecordId: updated.id,
    beforeValue: existing,
    afterValue: updated,
  });

  return NextResponse.json({
    title: "Leave policy updated",
    message: "Leave policy changes were saved successfully.",
    debugRef: `DEBUG-API-LEAVE-TYPE-${updated.id}`,
    item: updated,
  });
}
