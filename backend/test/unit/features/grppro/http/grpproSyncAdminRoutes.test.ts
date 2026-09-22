import assert from "node:assert/strict";
import { describe, it } from "node:test";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createGrpproSyncAdminRoutes } from "../../../../../src/features/grppro/http/routes/grpproSyncAdminRoutes";
import { GrpProSyncPipeline } from "../../../../../src/features/grppro/sync/GrpProSyncPipeline";
import type { GrpproSeniorReader } from "../../../../../src/features/grppro/sync/ports";
import { GetGrpproSyncRunUseCase } from "../../../../../src/features/grppro/useCases/GetGrpproSyncRunUseCase";
import { GetGrpproSyncStatusUseCase } from "../../../../../src/features/grppro/useCases/GetGrpproSyncStatusUseCase";
import { ListGrpproSyncRunsUseCase } from "../../../../../src/features/grppro/useCases/ListGrpproSyncRunsUseCase";
import { StartGrpproSyncUseCase } from "../../../../../src/features/grppro/useCases/StartGrpproSyncUseCase";
import { InMemoryGrpproSyncStore } from "../../../../helpers/InMemoryGrpproSyncStore";
import { InMemoryProdutoGrupoMapWriter } from "../../../../helpers/InMemoryProdutoGrupoMapWriter";

function createToken(role: string): string {
  return jwt.sign({ id: "user-test", role }, "dev_secret");
}

function createApp(
  store: InMemoryGrpproSyncStore,
  seniorReader: GrpproSeniorReader,
): Express {
  const mapWriter = new InMemoryProdutoGrupoMapWriter();
  const pipeline = new GrpProSyncPipeline(store, seniorReader, mapWriter);
  const app = express();
  app.use(express.json());
  app.use(
    "/api/grppro/sync",
    createGrpproSyncAdminRoutes({
      getStatus: new GetGrpproSyncStatusUseCase(store),
      listRuns: new ListGrpproSyncRunsUseCase(store),
      getRun: new GetGrpproSyncRunUseCase(store),
      startSync: new StartGrpproSyncUseCase(pipeline),
    }),
  );
  return app;
}

const sampleRows = [
  {
    grupoCodigo: "G001",
    grupoDescricao: "Linha A",
    produtoCodigo: "ABC123",
  },
];

describe("GrpPro sync admin HTTP", () => {
  it("rejects unauthenticated access to sync status with 401", async () => {
    const store = new InMemoryGrpproSyncStore();
    const app = createApp(store, { fetchAll: async () => [] });

    const response = await request(app).get("/api/grppro/sync/status");

    assert.strictEqual(response.status, 401);
  });

  it("rejects non-ADMIN access to sync status with 403", async () => {
    const store = new InMemoryGrpproSyncStore();
    const app = createApp(store, { fetchAll: async () => [] });
    const token = createToken("VENDAS");

    const response = await request(app)
      .get("/api/grppro/sync/status")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 403);
  });

  it("returns status and run list for ADMIN", async () => {
    const store = new InMemoryGrpproSyncStore();
    const syncedAt = new Date("2026-09-18T06:00:00.000Z");
    const seniorReader: GrpproSeniorReader = {
      fetchAll: async () => sampleRows,
    };
    const mapWriter = new InMemoryProdutoGrupoMapWriter();
    const pipeline = new GrpProSyncPipeline(store, seniorReader, mapWriter, {
      now: () => syncedAt,
    });
    await pipeline.run();

    const app = createApp(store, seniorReader);
    const token = createToken("ADMIN");

    const statusResponse = await request(app)
      .get("/api/grppro/sync/status")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(statusResponse.status, 200);
    assert.ok(statusResponse.body.lastSuccessfulSyncAt);
    assert.strictEqual(statusResponse.body.lastRowCount, 1);
    assert.strictEqual(statusResponse.body.activeRunId, null);

    const runsResponse = await request(app)
      .get("/api/grppro/sync/runs")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(runsResponse.status, 200);
    assert.ok(Array.isArray(runsResponse.body.runs));
    assert.strictEqual(runsResponse.body.runs.length, 1);
    assert.strictEqual(runsResponse.body.runs[0].status, "SUCCEEDED");

    const runId = runsResponse.body.runs[0].id as string;
    const runResponse = await request(app)
      .get(`/api/grppro/sync/runs/${runId}`)
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(runResponse.status, 200);
    assert.strictEqual(runResponse.body.run.id, runId);
  });

  it("starts a sync run via ADMIN endpoint", async () => {
    const store = new InMemoryGrpproSyncStore();
    const app = createApp(store, { fetchAll: async () => sampleRows });
    const token = createToken("ADMIN");

    const response = await request(app)
      .post("/api/grppro/sync/runs")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 202);
    assert.strictEqual(response.body.run.status, "SUCCEEDED");
    assert.strictEqual(response.body.published, true);
    assert.strictEqual(response.body.rowCount, 1);
  });

  it("returns 409 when sync is already running", async () => {
    const store = new InMemoryGrpproSyncStore();
    await store.createRun();
    const app = createApp(store, { fetchAll: async () => sampleRows });
    const token = createToken("ADMIN");

    const response = await request(app)
      .post("/api/grppro/sync/runs")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 409);
    assert.strictEqual(response.body.code, "GRPPRO_SYNC_ALREADY_RUNNING");
  });

  it("rejects non-ADMIN start sync with 403", async () => {
    const store = new InMemoryGrpproSyncStore();
    const app = createApp(store, { fetchAll: async () => sampleRows });
    const token = createToken("USER");

    const response = await request(app)
      .post("/api/grppro/sync/runs")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(response.status, 403);
  });
});
