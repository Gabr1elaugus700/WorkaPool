import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OverviewCustomerSyncPipeline } from "../../../../../src/features/overviewCustomer/sync/OverviewCustomerSyncPipeline";
import type { SeniorStepExecutor } from "../../../../../src/features/overviewCustomer/sync/ports";
import { AppError } from "../../../../../src/utils/AppError";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

const MAX_ATTEMPTS = 3;

describe("OverviewCustomerSyncPipeline", () => {
  it("retries a step up to three attempts and records success on the third", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    let attempts = 0;
    const flakyStep: SeniorStepExecutor = {
      name: "resumo-comercial",
      execute: async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error(`transient failure ${attempts}`);
        }
        return { ok: true };
      },
    };
    const laterStep: SeniorStepExecutor = {
      name: "evolucao-mensal",
      execute: async () => ({ ok: true }),
    };
    let laterExecuted = 0;
    const laterWrapped: SeniorStepExecutor = {
      name: laterStep.name,
      execute: async () => {
        laterExecuted += 1;
        return laterStep.execute();
      },
    };

    const pipeline = new OverviewCustomerSyncPipeline(store, [
      flakyStep,
      laterWrapped,
    ]);

    const result = await pipeline.run();

    assert.strictEqual(attempts, MAX_ATTEMPTS);
    assert.strictEqual(result.run.status, "SUCCEEDED");
    const step = result.run.steps.find((s) => s.name === "resumo-comercial");
    assert.ok(step);
    assert.strictEqual(step.status, "SUCCEEDED");
    assert.strictEqual(step.attemptCount, MAX_ATTEMPTS);
    assert.strictEqual(laterExecuted, 1);
  });

  it("does not attempt a fourth time after the retry budget is exhausted", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    let attempts = 0;
    const alwaysFail: SeniorStepExecutor = {
      name: "resumo-comercial",
      execute: async () => {
        attempts += 1;
        throw new Error(`hard failure ${attempts}`);
      },
    };

    const pipeline = new OverviewCustomerSyncPipeline(store, [alwaysFail]);
    const result = await pipeline.run();

    assert.strictEqual(attempts, MAX_ATTEMPTS);
    assert.strictEqual(result.run.status, "FAILED");
    const step = result.run.steps.find((s) => s.name === "resumo-comercial");
    assert.ok(step);
    assert.strictEqual(step.status, "FAILED");
    assert.strictEqual(step.attemptCount, MAX_ATTEMPTS);
    assert.ok(step.lastError?.includes("hard failure"));
  });

  it("publishes a new snapshot and advances lastSuccessfulSyncAt on success", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const t0 = new Date("2026-01-01T00:00:00.000Z");
    store.seedSuccessfulSnapshot(
      { id: "snap-prev", publishedAt: t0, payload: { version: 1 } },
      t0,
    );

    const pipeline = new OverviewCustomerSyncPipeline(store, [
      { name: "dados-gerais-cliente", execute: async () => ({ rows: 1 }) },
      { name: "resumo-comercial", execute: async () => ({ rows: 2 }) },
    ]);

    const result = await pipeline.run();

    assert.strictEqual(result.published, true);
    assert.strictEqual(result.run.status, "SUCCEEDED");
    assert.ok(result.run.steps.every((s) => s.status === "SUCCEEDED"));

    const served = await store.getServedSnapshot();
    assert.ok(served);
    assert.notStrictEqual(served.id, "snap-prev");

    const lastSuccess = await store.getLastSuccessfulSyncAt();
    assert.ok(lastSuccess);
    assert.ok(lastSuccess.getTime() > t0.getTime());
  });

  it("retains the previous snapshot and lastSuccessfulSyncAt when a step fails", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const t0 = new Date("2026-01-01T00:00:00.000Z");
    store.seedSuccessfulSnapshot(
      { id: "snap-prev", publishedAt: t0, payload: { version: 1 } },
      t0,
    );

    const pipeline = new OverviewCustomerSyncPipeline(store, [
      { name: "dados-gerais-cliente", execute: async () => ({ rows: 1 }) },
      {
        name: "resumo-comercial",
        execute: async () => {
          throw new Error("senior unavailable");
        },
      },
    ]);

    const result = await pipeline.run();

    assert.strictEqual(result.published, false);
    assert.strictEqual(result.run.status, "FAILED");
    assert.ok(result.run.errorSummary?.includes("resumo-comercial"));
    const failedStep = result.run.steps.find(
      (s) => s.name === "resumo-comercial",
    );
    assert.ok(failedStep);
    assert.strictEqual(failedStep.status, "FAILED");
    assert.ok(failedStep.lastError?.includes("senior unavailable"));

    const served = await store.getServedSnapshot();
    assert.ok(served);
    assert.strictEqual(served.id, "snap-prev");

    const lastSuccess = await store.getLastSuccessfulSyncAt();
    assert.ok(lastSuccess);
    assert.strictEqual(lastSuccess.getTime(), t0.getTime());
  });

  it("rejects a concurrent start while a run is active", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstStarted: (() => void) | undefined;
    const firstStartedPromise = new Promise<void>((resolve) => {
      firstStarted = resolve;
    });

    const slowStep: SeniorStepExecutor = {
      name: "dados-gerais-cliente",
      execute: async () => {
        firstStarted?.();
        await firstGate;
        return { ok: true };
      },
    };

    const pipeline = new OverviewCustomerSyncPipeline(store, [slowStep]);
    const firstRunPromise = pipeline.run();
    await firstStartedPromise;

    await assert.rejects(
      async () => pipeline.run(),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.code, "OVERVIEW_SYNC_ALREADY_RUNNING");
        return true;
      },
    );

    releaseFirst?.();
    const firstResult = await firstRunPromise;
    assert.strictEqual(firstResult.run.status, "SUCCEEDED");

    const active = await store.getActiveRun();
    assert.strictEqual(active, null);
  });

  it("retryFailedStep re-executes only the failed step", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const executionCounts = new Map<string, number>();

    const counting = (name: string, impl: () => Promise<unknown>): SeniorStepExecutor => ({
      name,
      execute: async () => {
        executionCounts.set(name, (executionCounts.get(name) ?? 0) + 1);
        return impl();
      },
    });

    let resumoShouldFail = true;
    const pipeline = new OverviewCustomerSyncPipeline(store, [
      counting("dados-gerais-cliente", async () => ({ ok: true })),
      counting("resumo-comercial", async () => {
        if (resumoShouldFail) {
          throw new Error("step failed");
        }
        return { ok: true };
      }),
      counting("evolucao-mensal", async () => ({ ok: true })),
    ]);

    const failed = await pipeline.run();
    assert.strictEqual(failed.run.status, "FAILED");
    assert.strictEqual(executionCounts.get("dados-gerais-cliente"), 1);
    assert.strictEqual(executionCounts.get("resumo-comercial"), MAX_ATTEMPTS);
    assert.strictEqual(executionCounts.get("evolucao-mensal"), undefined);

    resumoShouldFail = false;
    const retried = await pipeline.retryFailedStep(
      failed.run.id,
      "resumo-comercial",
    );

    assert.strictEqual(executionCounts.get("dados-gerais-cliente"), 1);
    assert.strictEqual(
      executionCounts.get("resumo-comercial"),
      MAX_ATTEMPTS + 1,
    );
    assert.strictEqual(executionCounts.get("evolucao-mensal"), 1);
    assert.strictEqual(retried.run.status, "SUCCEEDED");
    assert.strictEqual(retried.published, true);
  });

  it("successful failed-step retry publishes and advances lastSuccessfulSyncAt", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const t0 = new Date("2026-01-01T00:00:00.000Z");
    store.seedSuccessfulSnapshot(
      { id: "snap-prev", publishedAt: t0, payload: { version: 1 } },
      t0,
    );

    let shouldFail = true;
    const pipeline = new OverviewCustomerSyncPipeline(store, [
      { name: "only-step", execute: async () => {
        if (shouldFail) {
          throw new Error("boom");
        }
        return { ok: true };
      } },
    ]);

    const failed = await pipeline.run();
    assert.strictEqual(failed.published, false);

    shouldFail = false;
    const retried = await pipeline.retryFailedStep(failed.run.id, "only-step");

    assert.strictEqual(retried.published, true);
    assert.strictEqual(retried.run.status, "SUCCEEDED");
    const served = await store.getServedSnapshot();
    assert.ok(served);
    assert.notStrictEqual(served.id, "snap-prev");
    const lastSuccess = await store.getLastSuccessfulSyncAt();
    assert.ok(lastSuccess);
    assert.ok(lastSuccess.getTime() > t0.getTime());
  });

  it("failed-step retry that still fails leaves prior snapshot unchanged", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const t0 = new Date("2026-01-01T00:00:00.000Z");
    store.seedSuccessfulSnapshot(
      { id: "snap-prev", publishedAt: t0, payload: { version: 1 } },
      t0,
    );

    const pipeline = new OverviewCustomerSyncPipeline(store, [
      {
        name: "only-step",
        execute: async () => {
          throw new Error("still broken");
        },
      },
    ]);

    const failed = await pipeline.run();
    const retried = await pipeline.retryFailedStep(failed.run.id, "only-step");

    assert.strictEqual(retried.published, false);
    assert.strictEqual(retried.run.status, "FAILED");

    const served = await store.getServedSnapshot();
    assert.ok(served);
    assert.strictEqual(served.id, "snap-prev");
    const lastSuccess = await store.getLastSuccessfulSyncAt();
    assert.ok(lastSuccess);
    assert.strictEqual(lastSuccess.getTime(), t0.getTime());
  });
});
