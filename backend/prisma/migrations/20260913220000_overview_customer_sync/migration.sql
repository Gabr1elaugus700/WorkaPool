-- CreateEnum
CREATE TYPE "OverviewSyncRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "OverviewSyncStepStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "overview_customer_sync_run" (
    "id" TEXT NOT NULL,
    "status" "OverviewSyncRunStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "errorSummary" TEXT,

    CONSTRAINT "overview_customer_sync_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overview_customer_sync_step" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "OverviewSyncStepStatus" NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "overview_customer_sync_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overview_customer_snapshot" (
    "id" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "overview_customer_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overview_customer_sync_meta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "servedSnapshotId" TEXT,

    CONSTRAINT "overview_customer_sync_meta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "overview_customer_sync_run_status_idx" ON "overview_customer_sync_run"("status");

-- CreateIndex
CREATE INDEX "overview_customer_sync_step_runId_idx" ON "overview_customer_sync_step"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "overview_customer_sync_step_runId_name_key" ON "overview_customer_sync_step"("runId", "name");

-- AddForeignKey
ALTER TABLE "overview_customer_sync_step" ADD CONSTRAINT "overview_customer_sync_step_runId_fkey" FOREIGN KEY ("runId") REFERENCES "overview_customer_sync_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
