import { PrismaClient } from "@prisma/client";

/**
 * Ensures IBC expedition tables/enums exist on workapool_test when
 * prisma migrate deploy is blocked by earlier failed migrations.
 */
export async function ensureIbcExpedicaoSchema(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "IbcAptidao" AS ENUM ('APTO', 'INAPTO');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "IbcCustodia" AS ENUM ('PATIO', 'EM_VIAGEM');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Ibc" (
      "id" TEXT NOT NULL,
      "identificador" TEXT NOT NULL,
      "aptidao" "IbcAptidao" NOT NULL,
      "custodia" "IbcCustodia" NOT NULL DEFAULT 'PATIO',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Ibc_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Ibc_identificador_key" ON "Ibc"("identificador")`,
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ExpedicaoIbc" (
      "id" TEXT NOT NULL,
      "cargaId" TEXT NOT NULL,
      "fechadoPorId" TEXT NOT NULL,
      "fechadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ExpedicaoIbc_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "ExpedicaoIbc_cargaId_key" ON "ExpedicaoIbc"("cargaId")`,
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AlocacaoIbc" (
      "id" TEXT NOT NULL,
      "ibcId" TEXT NOT NULL,
      "cargaId" TEXT NOT NULL,
      "numPed" TEXT NOT NULL,
      "alocadoPorId" TEXT NOT NULL,
      "alocadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expedicaoIbcId" TEXT,
      CONSTRAINT "AlocacaoIbc_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "AlocacaoIbc_ibcId_key" ON "AlocacaoIbc"("ibcId")`,
  );

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "AlocacaoIbc_cargaId_numPed_idx" ON "AlocacaoIbc"("cargaId", "numPed")`,
  );

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "ExpedicaoIbc"
        ADD CONSTRAINT "ExpedicaoIbc_cargaId_fkey"
        FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "ExpedicaoIbc"
        ADD CONSTRAINT "ExpedicaoIbc_fechadoPorId_fkey"
        FOREIGN KEY ("fechadoPorId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "AlocacaoIbc"
        ADD CONSTRAINT "AlocacaoIbc_ibcId_fkey"
        FOREIGN KEY ("ibcId") REFERENCES "Ibc"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "AlocacaoIbc"
        ADD CONSTRAINT "AlocacaoIbc_cargaId_fkey"
        FOREIGN KEY ("cargaId") REFERENCES "Cargas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "AlocacaoIbc"
        ADD CONSTRAINT "AlocacaoIbc_alocadoPorId_fkey"
        FOREIGN KEY ("alocadoPorId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "AlocacaoIbc"
        ADD CONSTRAINT "AlocacaoIbc_expedicaoIbcId_fkey"
        FOREIGN KEY ("expedicaoIbcId") REFERENCES "ExpedicaoIbc"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
}
