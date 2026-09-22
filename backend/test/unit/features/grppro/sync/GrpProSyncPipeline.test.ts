import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GrpProSyncPipeline } from "../../../../../src/features/grppro/sync/GrpProSyncPipeline";
import type { GrpproSeniorReader } from "../../../../../src/features/grppro/sync/ports";
import { AppError } from "../../../../../src/utils/AppError";
import { InMemoryGrpproSyncStore } from "../../../../helpers/InMemoryGrpproSyncStore";
import { InMemoryProdutoGrupoMapWriter } from "../../../../helpers/InMemoryProdutoGrupoMapWriter";

const sampleRows = [
  {
    grupoCodigo: "G001",
    grupoDescricao: "Linha A",
    produtoCodigo: "ABC123",
  },
  {
    grupoCodigo: "G001",
    grupoDescricao: "Linha A",
    produtoCodigo: "DEF456",
  },
];

describe("GrpProSyncPipeline", () => {
  it("publishes mirror rows and updates meta on success", async () => {
    const store = new InMemoryGrpproSyncStore();
    const mapWriter = new InMemoryProdutoGrupoMapWriter();
    const seniorReader: GrpproSeniorReader = {
      fetchAll: async () => sampleRows,
    };
    const syncedAt = new Date("2026-09-18T06:00:00.000Z");

    const pipeline = new GrpProSyncPipeline(store, seniorReader, mapWriter, {
      now: () => syncedAt,
    });

    const result = await pipeline.run();

    assert.strictEqual(result.published, true);
    assert.strictEqual(result.run.status, "SUCCEEDED");
    assert.strictEqual(result.rowCount, 2);
    assert.strictEqual(mapWriter.swapCount, 1);
    assert.deepStrictEqual(mapWriter.productionRows, sampleRows);

    const lastSuccess = await store.getLastSuccessfulSyncAt();
    assert.deepStrictEqual(lastSuccess, syncedAt);
    assert.strictEqual(await store.getLastRowCount(), 2);
  });

  it("does not publish when swap fails and keeps prior production rows", async () => {
    const store = new InMemoryGrpproSyncStore();
    const mapWriter = new InMemoryProdutoGrupoMapWriter();
    mapWriter.productionRows = [
      {
        grupoCodigo: "G099",
        grupoDescricao: "Legado",
        produtoCodigo: "OLD001",
      },
    ];
    mapWriter.shouldFailOnSwap = true;

    const seniorReader: GrpproSeniorReader = {
      fetchAll: async () => sampleRows,
    };
    const pipeline = new GrpProSyncPipeline(store, seniorReader, mapWriter);

    const result = await pipeline.run();

    assert.strictEqual(result.published, false);
    assert.strictEqual(result.run.status, "FAILED");
    assert.ok(result.run.error?.includes("swap failed"));
    assert.deepStrictEqual(mapWriter.productionRows, [
      {
        grupoCodigo: "G099",
        grupoDescricao: "Legado",
        produtoCodigo: "OLD001",
      },
    ]);
    assert.strictEqual(await store.getLastSuccessfulSyncAt(), null);
  });

  it("rejects concurrent runs with 409", async () => {
    const store = new InMemoryGrpproSyncStore();
    await store.createRun();

    const pipeline = new GrpProSyncPipeline(
      store,
      { fetchAll: async () => [] },
      new InMemoryProdutoGrupoMapWriter(),
    );

    await assert.rejects(
      () => pipeline.run(),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.strictEqual(error.statusCode, 409);
        assert.strictEqual(error.code, "GRPPRO_SYNC_ALREADY_RUNNING");
        return true;
      },
    );
  });
});
