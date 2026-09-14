import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import { PrismaClient, Role } from "@prisma/client";
import { IbcExpedicaoRepository } from "../../../../src/features/ibc/repositories/IbcExpedicaoRepository";
import { ensureIbcCadastroSchema } from "../../../helpers/ensureIbcCadastroSchema";

const FIXTURE_PREFIX = "test-exp-63-";
const FIXTURE_COD_CAR = 63001;

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

async function cleanupFixtures(): Promise<void> {
  const like = `${FIXTURE_PREFIX}%`;
  await prisma.$executeRawUnsafe(
    `DELETE FROM "AlocacaoIbc" WHERE "cargaId" LIKE '${like}'`,
  ).catch(() => undefined);
  await prisma.$executeRawUnsafe(
    `DELETE FROM "ExpedicaoIbc" WHERE "cargaId" LIKE '${like}'`,
  ).catch(() => undefined);
  await prisma.$executeRawUnsafe(
    `DELETE FROM "Ibc" WHERE "identificador" LIKE '${like}%'`,
  ).catch(() => undefined);
  await prisma.cargas.deleteMany({
    where: { id: { startsWith: FIXTURE_PREFIX } },
  });
  await prisma.user.deleteMany({
    where: { user: { startsWith: FIXTURE_PREFIX } },
  });
}

describe("Fechar expedição persists atomically (#63)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureIbcCadastroSchema(prisma);
    await cleanupFixtures();
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("fecharExpedicao writes ExpedicaoIbc, EM_VIAGEM custody, and locks allocations in one transaction", async () => {
    const cargaId = `${FIXTURE_PREFIX}carga`;
    const user = await prisma.user.create({
      data: {
        user: `${FIXTURE_PREFIX}almox`,
        password: "hashed",
        role: Role.ALMOX,
        name: "Almox Teste",
      },
    });
    await prisma.cargas.create({
      data: {
        id: cargaId,
        codCar: FIXTURE_COD_CAR,
        destino: "Blumenau",
        pesoMax: 10000,
        custoMin: 0,
        situacao: "FECHADA",
        previsaoSaida: new Date("2026-09-08T10:00:00.000Z"),
      },
    });

    const ibcA = await prisma.ibc.create({
      data: {
        identificador: `${FIXTURE_PREFIX}H0045`,
        aptidao: "APTO",
        custodia: "PATIO",
      },
    });
    const ibcB = await prisma.ibc.create({
      data: {
        identificador: `${FIXTURE_PREFIX}H0046`,
        aptidao: "APTO",
        custodia: "PATIO",
      },
    });

    const alocA = await prisma.alocacaoIbc.create({
      data: {
        ibcId: ibcA.id,
        cargaId,
        numPed: "1120",
        alocadoPorId: user.id,
      },
    });
    const alocB = await prisma.alocacaoIbc.create({
      data: {
        ibcId: ibcB.id,
        cargaId,
        numPed: "1120",
        alocadoPorId: user.id,
      },
    });

    const repository = new IbcExpedicaoRepository(undefined, prisma);
    const expedicao = await repository.fecharExpedicao({
      cargaId,
      fechadoPorId: user.id,
      alocacaoIds: [alocA.id, alocB.id],
      ibcIds: [ibcA.id, ibcB.id],
    });

    assert.equal(expedicao.cargaId, cargaId);
    assert.equal(expedicao.fechadoPorId, user.id);

    const persistedExpedicao = await prisma.expedicaoIbc.findUnique({
      where: { cargaId },
    });
    assert.ok(persistedExpedicao);
    assert.equal(persistedExpedicao.id, expedicao.id);

    const ibcs = await prisma.ibc.findMany({
      where: { id: { in: [ibcA.id, ibcB.id] } },
      orderBy: { identificador: "asc" },
    });
    assert.equal(ibcs.length, 2);
    assert.ok(ibcs.every((row) => row.custodia === "EM_VIAGEM"));

    const alocacoes = await prisma.alocacaoIbc.findMany({
      where: { id: { in: [alocA.id, alocB.id] } },
    });
    assert.equal(alocacoes.length, 2);
    assert.ok(
      alocacoes.every((row) => row.expedicaoIbcId === persistedExpedicao.id),
    );
  });
});
