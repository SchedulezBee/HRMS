import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { adminUserUpdateSchema } from "@/lib/validation/hrms";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = adminUserUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "HR Admin update payload is invalid.",
        debugRef: "DEBUG-API-ADMIN-UPDATE-VALIDATION",
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const existing = await prisma.userAccount.findFirst({
    where: {
      id,
      tenantId: authResult.session.user.tenantId,
      role: AppRole.HR_ADMIN,
    },
  });

  if (!existing) {
    return NextResponse.json(
      {
        title: "HR Admin not found",
        message: "The selected HR Admin account could not be found.",
        debugRef: "DEBUG-API-ADMIN-NOTFOUND",
      },
      { status: 404 },
    );
  }

  const updated = await prisma.userAccount.update({
    where: { id: existing.id },
    data: {
      active: parsed.data.active,
      passwordHash: parsed.data.password ? await hashPassword(parsed.data.password) : undefined,
    },
    include: {
      employee: {
        select: {
          fullName: true,
          employeeCode: true,
          department: true,
          jobTitle: true,
        },
      },
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: authResult.session.user.tenantId,
    actorUserId: authResult.session.user.id,
    module: "AdminUser",
    actionType: "UPDATE",
    targetRecordId: updated.id,
    beforeValue: existing,
    afterValue: updated,
  });

  return NextResponse.json({
    title: "HR Admin updated",
    message: "HR Admin access changes were stored successfully.",
    debugRef: `DEBUG-API-ADMIN-${updated.id}`,
    item: updated,
  });
}
