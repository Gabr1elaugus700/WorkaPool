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
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "primeiraInspecaoEm" TIMESTAMP(3)`,
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
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "prefixo" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Ibc" ADD COLUMN IF NOT EXISTS "sequencial" INTEGER`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Ibc_prefixo_sequencial_key" ON "Ibc"("prefixo", "sequencial")`,
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
    CREATE TABLE IF NOT EXISTS "IbcProduto" (
      "id" TEXT NOT NULL,
      "grupo_codigo" VARCHAR(10),
      "sigla" VARCHAR(2),
      "cor_hex" VARCHAR(7) NOT NULL,
      "universal" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "IbcProduto_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'IbcProduto' AND column_name = 'nome'
      ) THEN
        UPDATE "Ibc" SET "produtoId" = NULL
        WHERE "produtoId" IN (SELECT id FROM "IbcProduto");
        DELETE FROM "IbcProduto";
        ALTER TABLE "IbcProduto" DROP COLUMN "nome";
        ALTER TABLE "IbcProduto" DROP COLUMN "abreviacao";
      END IF;
    END $$
  `);
  await prisma.$executeRawUnsafe(`ALTER TABLE "IbcProduto" ADD COLUMN IF NOT EXISTS "grupo_codigo" VARCHAR(10)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "IbcProduto" ADD COLUMN IF NOT EXISTS "sigla" VARCHAR(2)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "IbcProduto" ADD COLUMN IF NOT EXISTS "cor_hex" VARCHAR(7)`);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "IbcProduto" ADD COLUMN IF NOT EXISTS "universal" BOOLEAN NOT NULL DEFAULT false`,
  );
  await prisma.$executeRawUnsafe(`UPDATE "IbcProduto" SET "cor_hex" = '#000000' WHERE "cor_hex" IS NULL`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "IbcProduto" ALTER COLUMN "cor_hex" SET NOT NULL`);
  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "IbcProduto_abreviacao_key"`);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "IbcProduto_grupoCodigo_key" ON "IbcProduto"("grupo_codigo")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "IbcProduto_sigla_key" ON "IbcProduto"("sigla")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "IbcProduto_corHex_key" ON "IbcProduto"("cor_hex")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "IbcProduto_universal_key" ON "IbcProduto"("universal") WHERE "universal" = true`,
  );
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "IbcProduto" ADD CONSTRAINT "IbcProduto_forma_check" CHECK (
        ("universal" = true AND "grupo_codigo" IS NULL AND "sigla" IS NULL)
        OR ("universal" = false AND "grupo_codigo" IS NOT NULL AND "sigla" IS NOT NULL)
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "produto_grupo_map" (
      "grupo_codigo" VARCHAR(10) NOT NULL,
      "grupo_descricao" VARCHAR(100) NOT NULL,
      "produto_codigo" VARCHAR(10) NOT NULL,
      "synced_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "produto_grupo_map_pkey" PRIMARY KEY ("produto_codigo")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "produto_grupo_map_grupo_codigo_idx" ON "produto_grupo_map"("grupo_codigo")`,
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
