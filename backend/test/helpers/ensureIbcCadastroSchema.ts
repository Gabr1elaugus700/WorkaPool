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
}
