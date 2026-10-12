import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import { PrismaClient, Role } from "@prisma/client";
import { IbcExpedicaoRepository } from "../../../../src/features/ibc/repositories/IbcExpedicaoRepository";
import { ensureIbcCadastroSchema } from "../../../helpers/ensureIbcCadastroSchema";
import { ensureIbcExpedicaoSchema } from "../../../helpers/ensureIbcExpedicaoSchema";

const FIXTURE_PREFIX = "test-em-viagem-320-";
const COD_SEM_EXPEDICAO = 320001;
const COD_SO_PATIO = 320002;
const COD_ANTIGA = 320003;
const COD_RECENTE = 320004;

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

async function createCarga(codCar: number): Promise<string> {
  const id = `${FIXTURE_PREFIX}${codCar}`;
  await prisma.cargas.create({
    data: {
      id,
      codCar,
      destino: "Blumenau",
      pesoMax: 10000,
      custoMin: 0,
      situacao: "FECHADA",
      previsaoSaida: new Date("2026-10-01T10:00:00.000Z"),
    },
  });
  return id;
}

async function createIbc(
  suffix: string,
  custodia: "PATIO" | "EM_VIAGEM",
): Promise<string> {
  const ibc = await prisma.ibc.create({
    data: {
      identificador: `${FIXTURE_PREFIX}${suffix}`,
      aptidao: "APTO",
      custodia,
    },
  });
  return ibc.id;
}

describe("IbcExpedicaoRepository.listCargasEmViagem (#320)", () => {
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

  it("lista só carga expedida com IBC EM_VIAGEM, da expedição mais recente para a mais antiga", async () => {
    const user = await prisma.user.create({
      data: {
        user: `${FIXTURE_PREFIX}almox`,
        password: "hashed",
        role: Role.ALMOX,
        name: "Almox Teste",
      },
    });

    const semExpedicaoId = await createCarga(COD_SEM_EXPEDICAO);
    await prisma.cargaPedidoIbc.create({
      data: {
        cargaId: semExpedicaoId,
        numPed: "1000",
        cliente: "Fora",
        quantidadeEsperadaTotal: 1,
        quantidadeEsperadaVenda: 1,
        quantidadeEsperadaEmprestimo: 0,
      },
    });
    const ibcSemExpedicao = await createIbc("H0001", "EM_VIAGEM");
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: ibcSemExpedicao,
        cargaId: semExpedicaoId,
        numPed: "1000",
        alocadoPorId: user.id,
      },
    });

    const patioId = await createCarga(COD_SO_PATIO);
    const expedicaoPatio = await prisma.expedicaoIbc.create({
      data: { cargaId: patioId, fechadoPorId: user.id },
    });
    const ibcPatio = await createIbc("H0002", "PATIO");
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: ibcPatio,
        cargaId: patioId,
        numPed: "2000",
        alocadoPorId: user.id,
        expedicaoIbcId: expedicaoPatio.id,
      },
    });

    const antigaId = await createCarga(COD_ANTIGA);
    const expedicaoAntiga = await prisma.expedicaoIbc.create({
      data: {
        cargaId: antigaId,
        fechadoPorId: user.id,
        fechadoEm: new Date("2026-10-01T12:00:00.000Z"),
      },
    });
    const ibcAntigo = await createIbc("H0003", "EM_VIAGEM");
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: ibcAntigo,
        cargaId: antigaId,
        numPed: "3000",
        alocadoPorId: user.id,
        expedicaoIbcId: expedicaoAntiga.id,
      },
    });

    const recenteId = await createCarga(COD_RECENTE);
    await prisma.cargaPedidoIbc.create({
      data: {
        cargaId: recenteId,
        numPed: "1120",
        codCli: "C1",
        cliente: "Cliente Teste",
        quantidadeEsperadaTotal: 2,
        quantidadeEsperadaVenda: 1,
        quantidadeEsperadaEmprestimo: 1,
        posCar: 1,
      },
    });
    const expedicaoRecente = await prisma.expedicaoIbc.create({
      data: {
        cargaId: recenteId,
        fechadoPorId: user.id,
        fechadoEm: new Date("2026-10-03T15:00:00.000Z"),
      },
    });
    const ibcViagem = await createIbc("H0004", "EM_VIAGEM");
    const ibcPatioNaRecente = await createIbc("H0005", "PATIO");
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: ibcViagem,
        cargaId: recenteId,
        numPed: "1120",
        alocadoPorId: user.id,
        expedicaoIbcId: expedicaoRecente.id,
      },
    });
    await prisma.alocacaoIbc.create({
      data: {
        ibcId: ibcPatioNaRecente,
        cargaId: recenteId,
        numPed: "1120",
        alocadoPorId: user.id,
        expedicaoIbcId: expedicaoRecente.id,
      },
    });

    const cargas = await new IbcExpedicaoRepository(prisma).listCargasEmViagem();
    const fixtures = cargas.filter((carga) => carga.id.startsWith(FIXTURE_PREFIX));

    assert.deepEqual(
      fixtures.map((carga) => carga.codCar),
      [COD_RECENTE, COD_ANTIGA],
    );
    const [recente] = fixtures;
    assert.equal(recente.destino, "Blumenau");
    assert.equal(recente.situacao, "FECHADA");
    assert.equal(
      recente.expedicao.fechadoEm.toISOString(),
      "2026-10-03T15:00:00.000Z",
    );
    assert.equal(recente.pedidosIbc.length, 1);
    assert.equal(recente.pedidosIbc[0]?.posCar, 1);
    assert.equal(recente.alocacoes.length, 2);
    assert.deepEqual(
      recente.alocacoes.map((alocacao) => alocacao.custodia).sort(),
      ["EM_VIAGEM", "PATIO"],
    );
  });
});
