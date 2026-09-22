import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { GrpproSyncRepository } from "../../../../../src/features/grppro/repositories/GrpproSyncRepository";
import { ProdutoGrupoMapRepository } from "../../../../../src/features/grppro/repositories/ProdutoGrupoMapRepository";
import { GrpProSyncPipeline } from "../../../../../src/features/grppro/sync/GrpProSyncPipeline";
import type { GrpproSeniorReader } from "../../../../../src/features/grppro/sync/ports";
import { ensureGrpproSyncSchema } from "../../../../helpers/ensureGrpproSyncSchema";

const prisma = new PrismaClient();
const store = new GrpproSyncRepository(prisma);
const mapWriter = new ProdutoGrupoMapRepository(prisma);

const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
if (databaseUrl.pathname !== "/workapool_test") {
  throw new Error(
    `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
  );
}

const sampleRows = [
  {
    grupoCodigo: "G001",
    grupoDescricao: "Linha A",
    produtoCodigo: "ABC123",
  },
  {
    grupoCodigo: "G002",
    grupoDescricao: "Linha B",
    produtoCodigo: "XYZ789",
  },
];

const cleanup = async (): Promise<void> => {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "produto_grupo_map_staging"`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "produto_grupo_map"`);
  await prisma.grpproSyncRun.deleteMany({});
  await prisma.grpproSyncMeta.deleteMany({});
};

describe("GrpProSyncPipeline integration", () => {
  before(async () => {
    await ensureGrpproSyncSchema(prisma);
  });

  beforeEach(cleanup);
  afterEach(cleanup);
  after(() => prisma.$disconnect());

  it("persists run metadata and production mirror on success", async () => {
    const seniorReader: GrpproSeniorReader = {
      fetchAll: async () => sampleRows,
    };
    const pipeline = new GrpProSyncPipeline(store, seniorReader, mapWriter);
    const result = await pipeline.run();

    assert.strictEqual(result.published, true);
    assert.strictEqual(result.run.status, "SUCCEEDED");
    assert.strictEqual(result.rowCount, 2);

    const productionCount = await mapWriter.countProduction();
    assert.strictEqual(productionCount, 2);

    const persistedRun = await prisma.grpproSyncRun.findUnique({
      where: { id: result.run.id },
    });
    assert.ok(persistedRun);
    assert.strictEqual(persistedRun.status, "SUCCEEDED");
    assert.strictEqual(persistedRun.rowCount, 2);

    const lastSuccess = await store.getLastSuccessfulSyncAt();
    assert.ok(lastSuccess);
    assert.strictEqual(await store.getLastRowCount(), 2);
  });

  it("retains production mirror when swap would fail", async () => {
    const syncedAt = new Date("2026-09-18T06:00:00.000Z");
    await prisma.produtoGrupoMap.create({
      data: {
        grupoCodigo: "G099",
        grupoDescricao: "Legado",
        produtoCodigo: "OLD001",
        syncedAt,
      },
    });

    const seniorReader: GrpproSeniorReader = {
      fetchAll: async () => {
        throw new Error("senior unavailable");
      },
    };
    const pipeline = new GrpProSyncPipeline(store, seniorReader, mapWriter);
    const result = await pipeline.run();

    assert.strictEqual(result.published, false);
    assert.strictEqual(result.run.status, "FAILED");

    const productionCount = await mapWriter.countProduction();
    assert.strictEqual(productionCount, 1);

    const row = await prisma.produtoGrupoMap.findUnique({
      where: { produtoCodigo: "OLD001" },
    });
    assert.ok(row);
    assert.strictEqual(row.grupoCodigo, "G099");
  });
});
