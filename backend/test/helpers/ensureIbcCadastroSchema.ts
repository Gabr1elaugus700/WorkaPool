import { PrismaClient } from "@prisma/client";
import { ensureIbcExpedicaoSchema } from "./ensureIbcExpedicaoSchema";

/**
 * Ensures IBC cadastro columns/enums exist on workapool_test.
 */
export async function ensureIbcCadastroSchema(
  prisma: PrismaClient,
): Promise<void> {
  await ensureIbcExpedicaoSchema(prisma);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "IbcTipoCadastro" AS ENUM ('NOVO', 'TROCA');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "IbcAquisicao" AS ENUM ('COMPRA', 'TROCA');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "IbcMotivoInaptidao" AS ENUM ('AGUARDANDO_INSPECAO', 'DATA_LIMITE');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "tipoCadastro" "IbcTipoCadastro" NOT NULL DEFAULT 'NOVO'`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "aquisicao" "IbcAquisicao" NOT NULL DEFAULT 'COMPRA'`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "motivoInaptidao" "IbcMotivoInaptidao"`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "dataLimite" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "baixadoEm" TIMESTAMP(3)`,
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IbcLote" (
      "id" TEXT NOT NULL,
      "numeroNf" TEXT,
      "dataLimite" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "IbcLote_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "loteId" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "produtoId" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "convertedToContainerId" TEXT`,
  );
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "Ibc" ADD CONSTRAINT "Ibc_loteId_fkey"
        FOREIGN KEY ("loteId") REFERENCES "IbcLote"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Ibc_loteId_idx" ON "Ibc"("loteId")`,
  );

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TABLE "IbcProduto" (
        "id" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "abreviacao" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "IbcProduto_pkey" PRIMARY KEY ("id")
      );
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
    END $$
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "IbcProduto_abreviacao_key" ON "IbcProduto"("abreviacao")`,
  );
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "Ibc" ADD CONSTRAINT "Ibc_produtoId_fkey"
        FOREIGN KEY ("produtoId") REFERENCES "IbcProduto"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Ibc_produtoId_idx" ON "Ibc"("produtoId")`,
  );
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "Ibc" ADD CONSTRAINT "Ibc_convertedToContainerId_fkey"
        FOREIGN KEY ("convertedToContainerId") REFERENCES "Ibc"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE INDEX "Ibc_convertedToContainerId_idx" ON "Ibc"("convertedToContainerId");
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IbcConversionHistory" (
      "id" TEXT NOT NULL,
      "fromContainerId" TEXT NOT NULL,
      "toContainerId" TEXT NOT NULL,
      "changeType" TEXT NOT NULL,
      "observation" TEXT,
      "actorId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "IbcConversionHistory_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "IbcConversionHistory" ADD CONSTRAINT "IbcConversionHistory_fromContainerId_fkey"
        FOREIGN KEY ("fromContainerId") REFERENCES "Ibc"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "IbcConversionHistory" ADD CONSTRAINT "IbcConversionHistory_toContainerId_fkey"
        FOREIGN KEY ("toContainerId") REFERENCES "Ibc"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE INDEX "IbcConversionHistory_fromContainerId_idx" ON "IbcConversionHistory"("fromContainerId");
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE INDEX "IbcConversionHistory_toContainerId_idx" ON "IbcConversionHistory"("toContainerId");
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
    END $$
  `);
}
