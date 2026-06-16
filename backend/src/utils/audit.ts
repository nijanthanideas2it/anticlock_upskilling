import type { PrismaClient } from '@prisma/client';

export async function writeAuditLog(
  tx: PrismaClient,
  ticketId: string,
  changedById: string,
  fieldName: string,
  oldValue: string | null | undefined,
  newValue: string | null | undefined,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      ticketId,
      changedById,
      fieldName,
      oldValue: oldValue != null ? String(oldValue) : null,
      newValue: newValue != null ? String(newValue) : null,
    },
  });
}
