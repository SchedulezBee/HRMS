import { AppRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api/session";
import {
  formatAuditDescription,
  getAuditWhere,
  type SessionScope,
} from "@/lib/hrms/reporting";
import { prisma } from "@/lib/prisma";

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

  const scope: SessionScope = {
    id: authResult.session.user.id,
    role: authResult.session.user.role,
    tenantId: authResult.session.user.tenantId,
    employeeId: authResult.session.user.employeeId ?? null,
  };

  const items = await prisma.auditLog.findMany({
    where: getAuditWhere(scope),
    include: {
      actor: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      module: item.module,
      actionType: item.actionType,
      actor: item.actor?.email ?? "System",
      createdAt: item.createdAt.toISOString(),
      description: formatAuditDescription(item.module, item.actionType, item.targetRecordId),
      targetRecordId: item.targetRecordId,
    })),
  });
}
