import { PrismaClient } from "@prisma/client";

/**
 * Ensures GrpPro sync tables/enums exist on workapool_test.
 */
export async function ensureGrpproSyncSchema(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "GrpproSyncRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');
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

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "produto_grupo_map_staging" (
      "grupo_codigo" VARCHAR(10) NOT NULL,
      "grupo_descricao" VARCHAR(100) NOT NULL,
      "produto_codigo" VARCHAR(10) NOT NULL,
      "synced_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "produto_grupo_map_staging_pkey" PRIMARY KEY ("produto_codigo")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "grppro_sync_run" (
      "id" TEXT NOT NULL,
      "status" "GrpproSyncRunStatus" NOT NULL,
      "startedAt" TIMESTAMP(3) NOT NULL,
      "finishedAt" TIMESTAMP(3),
      "rowCount" INTEGER,
      "error" TEXT,
      CONSTRAINT "grppro_sync_run_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "grppro_sync_meta" (
      "id" INTEGER NOT NULL DEFAULT 1,
      "lastSuccessfulSyncAt" TIMESTAMP(3),
      "lastRowCount" INTEGER,
      CONSTRAINT "grppro_sync_meta_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "produto_grupo_map_grupo_codigo_idx"
    ON "produto_grupo_map"("grupo_codigo")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "grppro_sync_run_status_idx"
    ON "grppro_sync_run"("status")
  `);
}
