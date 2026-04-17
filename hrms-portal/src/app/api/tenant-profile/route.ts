import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { tenantProfileUpdateSchema } from "@/lib/validation/hrms";

export async function GET() {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: authResult.session.user.tenantId },
    select: {
      id: true,
      code: true,
      name: true,
      contactEmail: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          departments: true,
          employees: true,
          users: true,
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json(
      {
        title: "Tenant not found",
        message: "The signed-in tenant could not be found.",
        debugRef: "DEBUG-API-TENANT-NOTFOUND",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ item: tenant });
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = tenantProfileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Tenant profile payload is invalid.",
        debugRef: "DEBUG-API-TENANT-VALIDATION",
      },
      { status: 400 },
    );
  }

  const existing = await prisma.tenant.findUnique({
    where: { id: authResult.session.user.tenantId },
  });

  if (!existing) {
    return NextResponse.json(
      {
        title: "Tenant not found",
        message: "The signed-in tenant could not be found.",
        debugRef: "DEBUG-API-TENANT-NOTFOUND",
      },
      { status: 404 },
    );
  }

  const updated = await prisma.tenant.update({
    where: { id: existing.id },
    data: {
      active: parsed.data.active,
      contactEmail: parsed.data.contactEmail || null,
      name: parsed.data.name.trim(),
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: existing.id,
    actorUserId: authResult.session.user.id,
    module: "Tenant",
    actionType: "UPDATE",
    targetRecordId: updated.id,
    beforeValue: existing,
    afterValue: updated,
  });

  return NextResponse.json({
    title: "Tenant profile updated",
    message: "Tenant profile changes were stored successfully.",
    debugRef: `DEBUG-API-TENANT-${updated.id}`,
    item: updated,
  });
}
