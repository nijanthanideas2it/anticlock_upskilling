import prisma from '../config/database';

export async function generateReferenceNumber(): Promise<string> {
  const result = await prisma.$queryRaw<{ value: string }[]>`
    INSERT INTO "SystemConfig" (id, key, value, description, "updatedAt")
    VALUES (gen_random_uuid(), 'ticket_counter', '1', 'Auto-incrementing ticket counter', NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = (CAST("SystemConfig".value AS INTEGER) + 1)::TEXT, "updatedAt" = NOW()
    RETURNING value
  `;

  const counter = parseInt(result[0]!.value, 10);
  return `SD-${String(counter).padStart(5, '0')}`;
}
