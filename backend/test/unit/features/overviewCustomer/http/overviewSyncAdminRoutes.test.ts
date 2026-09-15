import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createOverviewSyncAdminRoutes } from "../../../../../src/features/overviewCustomer/http/routes/overviewSyncAdminRoutes";
import { OverviewCustomerSyncPipeline } from "../../../../../src/features/overviewCustomer/sync/OverviewCustomerSyncPipeline";
import type { SeniorStepExecutor } from "../../../../../src/features/overviewCustomer/sync/ports";
import { GetOverviewSyncRunUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewSyncRunUseCase";
import { GetOverviewSyncStatusUseCase } from "../../../../../src/features/overviewCustomer/useCases/GetOverviewSyncStatusUseCase";
import { ListOverviewSyncRunsUseCase } from "../../../../../src/features/overviewCustomer/useCases/ListOverviewSyncRunsUseCase";
import { RetryOverviewSyncFailedStepUseCase } from "../../../../../src/features/overviewCustomer/useCases/RetryOverviewSyncFailedStepUseCase";
import { StartOverviewSyncUseCase } from "../../../../../src/features/overviewCustomer/useCases/StartOverviewSyncUseCase";
import { InMemoryOverviewCustomerSyncStore } from "../../../../helpers/InMemoryOverviewCustomerSyncStore";

function createToken(role: string): string {
  return jwt.sign({ id: "user-test", role }, "dev_secret");
}

function createApp(
  store: InMemoryOverviewCustomerSyncStore,
  steps: SeniorStepExecutor[],
): Express {
  const pipeline = new OverviewCustomerSyncPipeline(store, steps);
  const app = express();
  app.use(express.json());
  app.use(
    "/api/overview/sync",
    createOverviewSyncAdminRoutes({
      getStatus: new GetOverviewSyncStatusUseCase(store),
      listRuns: new ListOverviewSyncRunsUseCase(store),
      getRun: new GetOverviewSyncRunUseCase(store),
      retryFailedStep: new RetryOverviewSyncFailedStepUseCase(pipeline),
      startSync: new StartOverviewSyncUseCase(pipeline),
    }),
  );
  return app;
}

describe("Overview sync admin HTTP", () => {
  it("rejects unauthenticated access to sync status with 401", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store, []);

    const response = await request(app).get("/api/overview/sync/status");

    assert.strictEqual(response.status, 401);
  });

  it("rejects non-ADMIN access to sync status with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store, []);
    const token = createToken("VENDAS");

    const response = await request(app)
      .get("/api/overview/sync/status")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 403);
  });

  it("returns lastSuccessfulSyncAt and run list for ADMIN", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const t0 = new Date("2026-01-01T00:00:00.000Z");
    store.seedSuccessfulSnapshot(
      { id: "snap-admin", publishedAt: t0, payload: { version: 1 } },
      t0,
    );

    const steps: SeniorStepExecutor[] = [
      { name: "dados-gerais-cliente", execute: async () => ({ ok: true }) },
    ];
    const pipeline = new OverviewCustomerSyncPipeline(store, steps);
    await pipeline.run();

    const app = createApp(store, steps);
    const token = createToken("ADMIN");

    const statusResponse = await request(app)
      .get("/api/overview/sync/status")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(statusResponse.status, 200);
    assert.ok(statusResponse.body.lastSuccessfulSyncAt);
    assert.ok(statusResponse.body.servedSnapshotId);
    assert.notStrictEqual(statusResponse.body.servedSnapshotId, "snap-admin");

    const runsResponse = await request(app)
      .get("/api/overview/sync/runs")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(runsResponse.status, 200);
    assert.ok(Array.isArray(runsResponse.body.runs));
    assert.strictEqual(runsResponse.body.runs.length, 1);
    assert.strictEqual(runsResponse.body.runs[0].status, "SUCCEEDED");

    const runId = runsResponse.body.runs[0].id as string;
    const runResponse = await request(app)
      .get(`/api/overview/sync/runs/${runId}`)
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(runResponse.status, 200);
    assert.strictEqual(runResponse.body.run.id, runId);
    assert.strictEqual(runResponse.body.run.steps.length, 1);
  });

  it("starts a sync run via ADMIN endpoint", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store, [
      { name: "dados-gerais-cliente", execute: async () => ({ ok: true }) },
    ]);
    const token = createToken("ADMIN");

    const response = await request(app)
      .post("/api/overview/sync/runs")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 202);
    assert.strictEqual(response.body.run.status, "SUCCEEDED");
    assert.strictEqual(response.body.published, true);
  });

  it("ADMIN retryFailedStep re-executes only the failed step via HTTP", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const counts = new Map<string, number>();
    let failResumo = true;

    const steps: SeniorStepExecutor[] = [
      {
        name: "dados-gerais-cliente",
        execute: async () => {
          counts.set(
            "dados-gerais-cliente",
            (counts.get("dados-gerais-cliente") ?? 0) + 1,
          );
          return { ok: true };
        },
      },
      {
        name: "resumo-comercial",
        execute: async () => {
          counts.set(
            "resumo-comercial",
            (counts.get("resumo-comercial") ?? 0) + 1,
          );
          if (failResumo) {
            throw new Error("senior blip");
          }
          return { ok: true };
        },
      },
    ];

    const pipeline = new OverviewCustomerSyncPipeline(store, steps);
    const failed = await pipeline.run();
    assert.strictEqual(failed.run.status, "FAILED");

    failResumo = false;
    const app = createApp(store, steps);
    const token = createToken("ADMIN");

    const response = await request(app)
      .post(
        `/api/overview/sync/runs/${failed.run.id}/steps/resumo-comercial/retry`,
      )
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.published, true);
    assert.strictEqual(response.body.run.status, "SUCCEEDED");
    assert.strictEqual(counts.get("dados-gerais-cliente"), 1);
    assert.ok((counts.get("resumo-comercial") ?? 0) > 3);
  });

  it("rejects non-ADMIN retry with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store, [
      {
        name: "only-step",
        execute: async () => {
          throw new Error("fail");
        },
      },
    ]);
    const token = createToken("USER");

    const response = await request(app)
      .post("/api/overview/sync/runs/run-1/steps/only-step/retry")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 403);
  });

  it("rejects non-ADMIN start sync with 403", async () => {
    const store = new InMemoryOverviewCustomerSyncStore();
    const app = createApp(store, [
      { name: "only-step", execute: async () => ({ ok: true }) },
    ]);
    const token = createToken("USER");

    const response = await request(app)
      .post("/api/overview/sync/runs")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 403);
  });
});
