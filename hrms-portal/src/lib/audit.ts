import { PrismaClient } from "@prisma/client";

type AuditInput = {
  prisma: PrismaClient;
  tenantId: string;
  actorUserId?: string;
  module: string;
  actionType: string;
  targetRecordId: string;
  beforeValue?: unknown;
  afterValue?: unknown;
};

export async function writeAuditLog({
  prisma,
  tenantId,
  actorUserId,
  module,
  actionType,
  targetRecordId,
  beforeValue,
  afterValue,
}: AuditInput) {
  return prisma.auditLog.create({
    data: {
      tenantId,
      actorUserId,
      module,
      actionType,
      targetRecordId,
      beforeValue: beforeValue ? JSON.parse(JSON.stringify(beforeValue)) : undefined,
      afterValue: afterValue ? JSON.parse(JSON.stringify(afterValue)) : undefined,
    },
  });
}
