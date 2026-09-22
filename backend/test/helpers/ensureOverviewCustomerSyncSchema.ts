import { PrismaClient } from "@prisma/client";

/**
 * Ensures Overview Customer sync tables/enums exist on workapool_test.
 */
export async function ensureOverviewCustomerSyncSchema(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "OverviewSyncRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "OverviewSyncStepStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "overview_customer_sync_run" (
      "id" TEXT NOT NULL,
      "status" "OverviewSyncRunStatus" NOT NULL,
      "startedAt" TIMESTAMP(3) NOT NULL,
      "finishedAt" TIMESTAMP(3),
      "errorSummary" TEXT,
      CONSTRAINT "overview_customer_sync_run_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "overview_customer_sync_step" (
      "id" TEXT NOT NULL,
      "runId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "status" "OverviewSyncStepStatus" NOT NULL,
      "attemptCount" INTEGER NOT NULL DEFAULT 0,
      "lastError" TEXT,
      "startedAt" TIMESTAMP(3),
      "finishedAt" TIMESTAMP(3),
      CONSTRAINT "overview_customer_sync_step_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "overview_customer_snapshot" (
      "id" TEXT NOT NULL,
      "publishedAt" TIMESTAMP(3) NOT NULL,
      "payload" JSONB NOT NULL,
      CONSTRAINT "overview_customer_snapshot_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "overview_customer_sync_meta" (
      "id" INTEGER NOT NULL DEFAULT 1,
      "lastSuccessfulSyncAt" TIMESTAMP(3),
      "servedSnapshotId" TEXT,
      CONSTRAINT "overview_customer_sync_meta_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "overview_customer_sync_run_status_idx"
    ON "overview_customer_sync_run"("status")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "overview_customer_sync_step_runId_idx"
    ON "overview_customer_sync_step"("runId")
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "overview_customer_sync_step"
        ADD CONSTRAINT "overview_customer_sync_step_runId_name_key"
        UNIQUE ("runId", "name");
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "overview_customer_sync_step"
        ADD CONSTRAINT "overview_customer_sync_step_runId_fkey"
        FOREIGN KEY ("runId") REFERENCES "overview_customer_sync_run"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
}
