import { PrismaClient } from "@prisma/client";
import { ensureIbcChecklistSchema } from "./ensureIbcChecklistSchema";

/**
 * Ensures IBC inspeção tables/enums exist on workapool_test.
 */
export async function ensureIbcInspecaoSchema(
  prisma: PrismaClient,
): Promise<void> {
  await ensureIbcChecklistSchema(prisma);

  await prisma.$executeRawUnsafe(
    `ALTER TYPE "IbcMotivoInaptidao" ADD VALUE IF NOT EXISTS 'INSPECAO_REPROVADA'`,
  );
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "IbcInspecaoResultado" AS ENUM ('APROVADA', 'REPROVADA');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  const statements = [
    `CREATE TABLE IF NOT EXISTS "IbcInspecao" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ibcId" TEXT NOT NULL REFERENCES "Ibc"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      "checklistModeloId" TEXT NOT NULL REFERENCES "ChecklistModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      "resultado" "IbcInspecaoResultado" NOT NULL,
      "mediaObtida" DOUBLE PRECISION,
      "notaMinimaCritico" DOUBLE PRECISION NOT NULL,
      "mediaMinima" DOUBLE PRECISION NOT NULL,
      "inspetorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      "inspecionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "observacao" TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS "IbcInspecao_ibcId_checklistModeloId_inspecionadoEm_idx" ON "IbcInspecao"("ibcId", "checklistModeloId", "inspecionadoEm")`,
    `CREATE INDEX IF NOT EXISTS "IbcInspecao_checklistModeloId_idx" ON "IbcInspecao"("checklistModeloId")`,
    `CREATE INDEX IF NOT EXISTS "IbcInspecao_inspetorId_idx" ON "IbcInspecao"("inspetorId")`,
    `CREATE TABLE IF NOT EXISTS "IbcInspecaoResposta" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "inspecaoId" TEXT NOT NULL REFERENCES "IbcInspecao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "checklistItemId" TEXT NOT NULL REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      "nota" INTEGER NOT NULL,
      "critico" BOOLEAN NOT NULL,
      "descricao" TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "IbcInspecaoResposta_inspecaoId_checklistItemId_key" ON "IbcInspecaoResposta"("inspecaoId", "checklistItemId")`,
    `CREATE INDEX IF NOT EXISTS "IbcInspecaoResposta_checklistItemId_idx" ON "IbcInspecaoResposta"("checklistItemId")`,
  ];
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
}
