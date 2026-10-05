import { PrismaClient } from "@prisma/client";

/**
 * Ensures ProcessedEvent exists for workapool_test when prisma migrate deploy
 * is blocked by earlier failed migrations.
 */
export async function ensureProcessedEventSchema(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProcessedEvent" (
      "id" TEXT NOT NULL,
      "consumerName" TEXT NOT NULL,
      "eventId" TEXT NOT NULL,
      "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedEvent_consumerName_eventId_key" ON "ProcessedEvent"("consumerName", "eventId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "ProcessedEvent_eventId_idx" ON "ProcessedEvent"("eventId")`,
  );
}
