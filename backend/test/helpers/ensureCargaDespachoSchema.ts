import { PrismaClient } from "@prisma/client";

/**
 * Ensures CargaDespacho exists without motoristaId for workapool_test when
 * prisma migrate deploy is blocked by earlier failed migrations.
 */
export async function ensureCargaDespachoSchema(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CargaDespacho" (
      "id" TEXT NOT NULL,
      "cargaId" TEXT NOT NULL,
      "caminhaoId" TEXT NOT NULL,
      "fechadoPorId" TEXT NOT NULL,
      "fechadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CargaDespacho_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "CargaDespacho_cargaId_key" ON "CargaDespacho"("cargaId")`,
  );

  const motoristaColumn = await prisma.$queryRawUnsafe<
    Array<{ column_name: string }>
  >(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'CargaDespacho'
       AND column_name = 'motoristaId'`,
  );

  if (motoristaColumn.length > 0) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CargaDespacho" DROP CONSTRAINT IF EXISTS "CargaDespacho_motoristaId_fkey"`,
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "CargaDespacho" DROP COLUMN IF EXISTS "motoristaId"`,
    );
  }

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "CargaDespacho"
        ADD CONSTRAINT "CargaDespacho_cargaId_fkey"
        FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "CargaDespacho"
        ADD CONSTRAINT "CargaDespacho_caminhaoId_fkey"
        FOREIGN KEY ("caminhaoId") REFERENCES "Trucks"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "CargaDespacho"
        ADD CONSTRAINT "CargaDespacho_fechadoPorId_fkey"
        FOREIGN KEY ("fechadoPorId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OutboxEvent" (
      "id" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "aggregateType" TEXT NOT NULL,
      "aggregateId" TEXT NOT NULL,
      "payload" JSONB NOT NULL,
      "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "publishedAt" TIMESTAMP(3),
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "lastError" TEXT,
      "lockedAt" TIMESTAMP(3),
      CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
    )
  `);
}
