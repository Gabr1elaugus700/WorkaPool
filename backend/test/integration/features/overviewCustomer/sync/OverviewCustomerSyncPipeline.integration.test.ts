import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { OverviewCustomerSyncPipeline } from "../../../../../src/features/overviewCustomer/sync/OverviewCustomerSyncPipeline";
import type { SeniorStepExecutor } from "../../../../../src/features/overviewCustomer/sync/ports";
import { OverviewCustomerSyncRepository } from "../../../../../src/features/overviewCustomer/repositories/OverviewCustomerSyncRepository";
import { ensureOverviewCustomerSyncSchema } from "../../../../helpers/ensureOverviewCustomerSyncSchema";

const prisma = new PrismaClient();
const store = new OverviewCustomerSyncRepository(prisma);

const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
if (databaseUrl.pathname !== "/workapool_test") {
  throw new Error(
    `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
  );
}

const cleanup = async (): Promise<void> => {
  await prisma.overviewCustomerSyncStep.deleteMany({});
  await prisma.overviewCustomerSyncRun.deleteMany({});
  await prisma.overviewCustomerSyncMeta.deleteMany({});
  await prisma.overviewCustomerSnapshot.deleteMany({});
};

describe("OverviewCustomerSyncPipeline integration", () => {
  before(async () => {
    await ensureOverviewCustomerSyncSchema(prisma);
  });

  beforeEach(cleanup);
  afterEach(cleanup);
  after(() => prisma.$disconnect());

  it("persists run, steps, and published snapshot on success", async () => {
    const steps: SeniorStepExecutor[] = [
      { name: "dados-gerais-cliente", execute: async () => ({ rows: 3 }) },
      { name: "resumo-comercial", execute: async () => ({ rows: 5 }) },
    ];

    const pipeline = new OverviewCustomerSyncPipeline(store, steps);
    const result = await pipeline.run();

    assert.strictEqual(result.published, true);
    assert.strictEqual(result.run.status, "SUCCEEDED");

    const persistedRun = await prisma.overviewCustomerSyncRun.findUnique({
      where: { id: result.run.id },
      include: { steps: true },
    });
    assert.ok(persistedRun);
    assert.strictEqual(persistedRun.status, "SUCCEEDED");
    assert.strictEqual(persistedRun.steps.length, 2);
    assert.ok(persistedRun.steps.every((step) => step.status === "SUCCEEDED"));

    const served = await store.getServedSnapshot();
    assert.ok(served);
    assert.deepStrictEqual(served.payload, {
      "dados-gerais-cliente": { rows: 3 },
      "resumo-comercial": { rows: 5 },
    });

    const lastSuccess = await store.getLastSuccessfulSyncAt();
    assert.ok(lastSuccess);
  });

  it("persists failure metadata without replacing the served snapshot", async () => {
    const t0 = new Date("2026-01-01T00:00:00.000Z");
    await store.seedSuccessfulSnapshot(
      { id: "snap-prev-int", publishedAt: t0, payload: { version: 1 } },
      t0,
    );

    const steps: SeniorStepExecutor[] = [
      { name: "dados-gerais-cliente", execute: async () => ({ rows: 1 }) },
      {
        name: "resumo-comercial",
        execute: async () => {
          throw new Error("senior down");
        },
      },
    ];

    const pipeline = new OverviewCustomerSyncPipeline(store, steps);
    const result = await pipeline.run();

    assert.strictEqual(result.published, false);
    assert.strictEqual(result.run.status, "FAILED");

    const persistedRun = await prisma.overviewCustomerSyncRun.findUnique({
      where: { id: result.run.id },
      include: { steps: true },
    });
    assert.ok(persistedRun);
    assert.strictEqual(persistedRun.status, "FAILED");
    assert.ok(persistedRun.errorSummary?.includes("resumo-comercial"));
    const failedStep = persistedRun.steps.find(
      (step) => step.name === "resumo-comercial",
    );
    assert.ok(failedStep);
    assert.strictEqual(failedStep.status, "FAILED");
    assert.ok(failedStep.lastError?.includes("senior down"));

    const served = await store.getServedSnapshot();
    assert.ok(served);
    assert.strictEqual(served.id, "snap-prev-int");

    const lastSuccess = await store.getLastSuccessfulSyncAt();
    assert.ok(lastSuccess);
    assert.strictEqual(lastSuccess.getTime(), t0.getTime());
  });
});
