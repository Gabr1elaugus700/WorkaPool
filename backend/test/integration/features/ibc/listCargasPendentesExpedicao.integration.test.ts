import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import { PrismaClient, Role } from "@prisma/client";
import { IbcExpedicaoRepository } from "../../../../src/features/ibc/repositories/IbcExpedicaoRepository";
import { ensureIbcCadastroSchema } from "../../../helpers/ensureIbcCadastroSchema";
import { ensureIbcExpedicaoSchema } from "../../../helpers/ensureIbcExpedicaoSchema";

const FIXTURE_PREFIX = "test-lista-exp-296-";
const COD_CAR_PENDENTE = 296001;
const COD_CAR_ABERTA = 296002;
const COD_CAR_SEM_FOTO = 296003;
const COD_CAR_EXPEDIDA = 296004;

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
  const cargaFilter = { cargaId: { startsWith: FIXTURE_PREFIX } };
  await prisma.alocacaoIbc.deleteMany({ where: cargaFilter });
  await prisma.expedicaoIbc.deleteMany({ where: cargaFilter });
  await prisma.cargaPedidoIbc.deleteMany({ where: cargaFilter });
  await prisma.ibc.deleteMany({
    where: { identificador: { startsWith: FIXTURE_PREFIX } },
  });
  await prisma.cargas.deleteMany({
    where: { id: { startsWith: FIXTURE_PREFIX } },
  });
  await prisma.user.deleteMany({
    where: { user: { startsWith: FIXTURE_PREFIX } },
  });
}

async function createCarga(
  codCar: number,
  situacao: "ABERTA" | "FECHADA",
): Promise<string> {
  const id = `${FIXTURE_PREFIX}${codCar}`;
  await prisma.cargas.create({
    data: {
      id,
      codCar,
      destino: "Blumenau",
      pesoMax: 10000,
      custoMin: 0,
      situacao,
      previsaoSaida: new Date("2026-09-08T10:00:00.000Z"),
    },
  });
  return id;
}

async function createFoto(cargaId: string, numPed: string): Promise<void> {
  await prisma.cargaPedidoIbc.create({
    data: {
      cargaId,
      numPed,
      codCli: "C1",
      cliente: "Cliente Teste",
      quantidadeEsperadaTotal: 2,
      quantidadeEsperadaVenda: 1,
      quantidadeEsperadaEmprestimo: 1,
    },
  });
}

describe("IbcExpedicaoRepository.listCargasPendentesExpedicao (#296)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureIbcCadastroSchema(prisma);
    await ensureIbcExpedicaoSchema(prisma);
    await cleanupFixtures();
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("lista só carga FECHADA com foto e sem ExpedicaoIbc, com pedidos e alocações", async () => {
    const user = await prisma.user.create({
      data: {
        user: `${FIXTURE_PREFIX}almox`,
        password: "hashed",
        role: Role.ALMOX,
        name: "Almox Teste",
      },
    });

    const pendenteId = await createCarga(COD_CAR_PENDENTE, "FECHADA");
    await createFoto(pendenteId, "1120");
    const ibc = await prisma.ibc.create({
      data: {
        identificador: `${FIXTURE_PREFIX}H0045`,
        aptidao: "APTO",
        custodia: "PATIO",
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: ibc.id,
        cargaId: pendenteId,
        numPed: "1120",
        alocadoPorId: user.id,
      },
    });

    const abertaId = await createCarga(COD_CAR_ABERTA, "ABERTA");
    await createFoto(abertaId, "2220");

    await createCarga(COD_CAR_SEM_FOTO, "FECHADA");

    const expedidaId = await createCarga(COD_CAR_EXPEDIDA, "FECHADA");
    await createFoto(expedidaId, "4420");
    await prisma.expedicaoIbc.create({
      data: { cargaId: expedidaId, fechadoPorId: user.id },
    });

    const repository = new IbcExpedicaoRepository(undefined, prisma);
    const cargas = await repository.listCargasPendentesExpedicao();
    const fixtureCargas = cargas.filter((c) =>
      c.id.startsWith(FIXTURE_PREFIX),
    );

    assert.deepEqual(
      fixtureCargas.map((c) => c.codCar),
      [COD_CAR_PENDENTE],
    );
    const [pendente] = fixtureCargas;
    assert.equal(pendente.situacao, "FECHADA");
    assert.equal(pendente.pedidosIbc.length, 1);
    assert.equal(pendente.pedidosIbc[0].numPed, "1120");
    assert.equal(pendente.pedidosIbc[0].quantidadeEsperadaTotal, 2);
    assert.equal(pendente.alocacoes.length, 1);
    assert.equal(pendente.alocacoes[0].identificador, `${FIXTURE_PREFIX}H0045`);
  });
});
