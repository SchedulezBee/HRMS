import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { leavePolicyCreateSchema } from "@/lib/validation/hrms";

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

  const items = await prisma.leavePolicy.findMany({
    where: {
      tenantId: authResult.session.user.tenantId,
      ...(authResult.session.user.role === AppRole.TENANT_ADMIN ||
      authResult.session.user.role === AppRole.HR_ADMIN
        ? {}
        : { enabled: true }),
    },
    orderBy: [{ enabled: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN, AppRole.HR_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = leavePolicyCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "Leave policy payload is invalid.",
        debugRef: "DEBUG-API-LEAVE-TYPE-VALIDATION",
      },
      { status: 400 },
    );
  }

  const normalizedCode = parsed.data.code.trim().toUpperCase();
  const normalizedName = parsed.data.name.trim();

  const existing = await prisma.leavePolicy.findFirst({
    where: {
      tenantId: authResult.session.user.tenantId,
      OR: [{ code: normalizedCode }, { name: normalizedName }],
    },
  });

  if (existing) {
    return NextResponse.json(
      {
        title: "Leave policy already exists",
        message: "Leave policy code and name must be unique within the tenant.",
        debugRef: "DEBUG-API-LEAVE-TYPE-DUPLICATE",
      },
      { status: 409 },
    );
  }

  const created = await prisma.leavePolicy.create({
    data: {
      tenantId: authResult.session.user.tenantId,
      code: normalizedCode,
      enabled: parsed.data.enabled,
      entitlement: parsed.data.entitlement,
      name: normalizedName,
      openingBalance: parsed.data.openingBalance,
    },
  });

  await writeAuditLog({
    prisma,
    tenantId: authResult.session.user.tenantId,
    actorUserId: authResult.session.user.id,
    module: "LeavePolicy",
    actionType: "CREATE",
    targetRecordId: created.id,
    afterValue: created,
  });

  return NextResponse.json(
    {
      title: "Leave policy saved",
      message: "Leave policy has been created for this tenant.",
      debugRef: `DEBUG-API-LEAVE-TYPE-${created.id}`,
      item: created,
    },
    { status: 201 },
  );
}
