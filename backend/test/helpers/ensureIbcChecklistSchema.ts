import { PrismaClient } from "@prisma/client";
import { ensureIbcCadastroSchema } from "./ensureIbcCadastroSchema";

/**
 * Ensures IBC checklist columns/enum exist on workapool_test.
 */
export async function ensureIbcChecklistSchema(
  prisma: PrismaClient,
): Promise<void> {
  await ensureIbcCadastroSchema(prisma);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "ChecklistTipo" AS ENUM ('VISTORIA', 'IBC');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  const statements = [
    `ALTER TABLE "ChecklistItem" ADD COLUMN IF NOT EXISTS "critico" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "ChecklistItem" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "ChecklistModelo" ADD COLUMN IF NOT EXISTS "tipo" "ChecklistTipo" NOT NULL DEFAULT 'VISTORIA'`,
    `ALTER TABLE "ChecklistModelo" ADD COLUMN IF NOT EXISTS "notaMinimaCritico" DOUBLE PRECISION`,
    `ALTER TABLE "ChecklistModelo" ADD COLUMN IF NOT EXISTS "mediaMinima" DOUBLE PRECISION`,
    `ALTER TABLE "ChecklistModelo" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "ChecklistModeloItem" ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 0`,
    `CREATE INDEX IF NOT EXISTS "ChecklistModelo_tipo_idx" ON "ChecklistModelo"("tipo")`,
    `CREATE TABLE IF NOT EXISTS "IbcChecklistVinculo" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ibcId" TEXT NOT NULL REFERENCES "Ibc"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      "checklistModeloId" TEXT NOT NULL REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      "vinculadoPorId" TEXT NOT NULL,
      "vinculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "IbcChecklistVinculo_ibcId_checklistModeloId_key" ON "IbcChecklistVinculo"("ibcId", "checklistModeloId")`,
    `CREATE INDEX IF NOT EXISTS "IbcChecklistVinculo_checklistModeloId_idx" ON "IbcChecklistVinculo"("checklistModeloId")`,
  ];
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
}
