import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, before, describe, it } from "node:test";
import { PrismaClient, Role } from "@prisma/client";
import { Carga, SituacaoCarga } from "../../../../src/features/cargo/entities/Carga";
import { CargoRepository } from "../../../../src/features/cargo/repositories/CargoRepository";
import { PedidoRaw } from "../../../../src/features/pedidos/types/PedidoRaw";
import { FakeSapiens } from "../../../helpers/FakeSapiens";
import { ensureCargaDespachoSchema } from "../../../helpers/ensureCargaDespachoSchema";
import { ensureIbcExpedicaoSchema } from "../../../helpers/ensureIbcExpedicaoSchema";
import { ensureTrucksFleetSchema } from "../../../helpers/ensureTrucksFleetSchema";

const FIXTURE_PREFIX = "test-foto-ibc-295-";
const FIXTURE_PLATE = "TF2950";
const COD_CAR_VALIDOS = 295001;
const COD_CAR_INVALIDO = 295002;
const COD_CAR_SEM_IBC = 295003;
const COD_CAR_ROLLBACK = 295004;
const FIXTURE_COD_CARS = [
  COD_CAR_VALIDOS,
  COD_CAR_INVALIDO,
  COD_CAR_SEM_IBC,
  COD_CAR_ROLLBACK,
];

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

const buildRow = (
  codCar: number,
  numPed: string,
  overrides: Partial<PedidoRaw> = {},
): PedidoRaw => ({
  NUM_PED: numPed,
  COD_CLI: `C${numPed}`,
  CLIENTE: `Cliente ${numPed}`,
  CIDADE: "Blumenau",
  ESTADO: "SC",
  VENDEDOR: "Vendedor Teste",
  CODREP: 1,
  BLOQUEADO: "N",
  PESO: 200,
  PRODUTOS: "Produto",
  DERIVACAO: "001",
  QUANTIDADE: 1,
  CODCAR: codCar,
  POSCAR: 1,
  SITCAR: "A",
  QTD_ORI_PED: 1,
  ...overrides,
});

const ibcLine = (
  quantidade: number,
  volume: number | null,
  incluso: "S" | "N",
): Partial<PedidoRaw> => ({
  CODIGO_EMBALAGEM: 251001,
  VOLUME_EMBALAGEM: volume,
  QUANTIDADE: quantidade,
  INCLUSO: incluso,
});

type Fixture = {
  cargaId: string;
  codCar: number;
  truckId: string;
  userId: string;
  repository: CargoRepository;
};

async function createOpenCargaFixture(
  codCar: number,
  rows: PedidoRaw[],
): Promise<Fixture> {
  const cargaId = randomUUID();
  const previsaoSaida = new Date("2026-10-07T10:00:00.000Z");
  const user = await prisma.user.create({
    data: {
      user: `${FIXTURE_PREFIX}${codCar}`,
      password: "hashed",
      role: Role.LOGISTICA,
      name: "Logistica Foto IBC",
    },
  });
  const truck = await prisma.trucks.create({
    data: {
      name: `Truck Foto IBC ${codCar}`,
      capacity: 20000,
      plate: `${FIXTURE_PLATE}${codCar}`,
      active: true,
    },
  });
  await prisma.cargas.create({
    data: {
      id: cargaId,
      codCar,
      destino: "Blumenau",
      pesoMax: 10000,
      custoMin: 0,
      situacao: "ABERTA",
      previsaoSaida,
    },
  });
  const sapiens = new FakeSapiens({
    cargas: [
      new Carga({
        id: cargaId,
        codCar,
        destino: "Blumenau",
        pesoMaximo: 10000,
        previsaoSaida,
        situacao: SituacaoCarga.ABERTA,
      }),
    ],
    rows,
  });

  return {
    cargaId,
    codCar,
    truckId: truck.id,
    userId: user.id,
    repository: new CargoRepository(sapiens, prisma),
  };
}

async function cleanupFixtures(): Promise<void> {
  const cargas = await prisma.cargas.findMany({
    where: { codCar: { in: FIXTURE_COD_CARS } },
    select: { id: true },
  });
  const cargaIds = cargas.map((carga) => carga.id);

  await prisma.cargaPedidoIbc.deleteMany({ where: { cargaId: { in: cargaIds } } });
  await prisma.cargaDespacho.deleteMany({ where: { cargaId: { in: cargaIds } } });
  await prisma.cargasFechadas.deleteMany({ where: { cargaId: { in: cargaIds } } });
  await prisma.outboxEvent.deleteMany({ where: { aggregateId: { in: cargaIds } } });
  await prisma.cargas.deleteMany({ where: { id: { in: cargaIds } } });
  await prisma.trucks.deleteMany({ where: { plate: { startsWith: FIXTURE_PLATE } } });
  await prisma.user.deleteMany({ where: { user: { startsWith: FIXTURE_PREFIX } } });
}

function closeFixture(fixture: Fixture, caminhaoId = fixture.truckId) {
  return fixture.repository.closeCarga({
    codCar: fixture.codCar,
    caminhaoId,
    fechadoPorId: fixture.userId,
  });
}

function listFoto(cargaId: string) {
  return prisma.cargaPedidoIbc.findMany({
    where: { cargaId },
    orderBy: { numPed: "asc" },
  });
}

describe("Fechar Carga grava a foto de pedidos IBC (#295)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureTrucksFleetSchema(prisma);
    await ensureCargaDespachoSchema(prisma);
    await ensureIbcExpedicaoSchema(prisma);
    await cleanupFixtures();
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("records one CargaPedidoIbc per valid 251001 pedido with expected quantities", async () => {
    const fixture = await createOpenCargaFixture(COD_CAR_VALIDOS, [
      buildRow(COD_CAR_VALIDOS, "29500101", ibcLine(3000, 1000, "S")),
      buildRow(COD_CAR_VALIDOS, "29500101", {
        ...ibcLine(2000, 1000, "N"),
        DERIVACAO: "002",
      }),
      buildRow(COD_CAR_VALIDOS, "29500102", ibcLine(1000, 1000, "N")),
      buildRow(COD_CAR_VALIDOS, "29500103"),
    ]);

    await closeFixture(fixture);

    const foto = await listFoto(fixture.cargaId);
    assert.deepEqual(
      foto.map((item) => ({
        numPed: item.numPed,
        codCli: item.codCli,
        cliente: item.cliente,
        total: item.quantidadeEsperadaTotal,
        venda: item.quantidadeEsperadaVenda,
        emprestimo: item.quantidadeEsperadaEmprestimo,
        ibcInvalido: item.ibcInvalido,
      })),
      [
        {
          numPed: "29500101",
          codCli: "C29500101",
          cliente: "Cliente 29500101",
          total: 5,
          venda: 3,
          emprestimo: 2,
          ibcInvalido: false,
        },
        {
          numPed: "29500102",
          codCli: "C29500102",
          cliente: "Cliente 29500102",
          total: 1,
          venda: 0,
          emprestimo: 1,
          ibcInvalido: false,
        },
      ],
    );
  });

  it("records a Pedido IBC inválido with ibcInvalido true and zeros without blocking the close", async () => {
    const fixture = await createOpenCargaFixture(COD_CAR_INVALIDO, [
      buildRow(COD_CAR_INVALIDO, "29500201", ibcLine(1500, 1000, "S")),
    ]);

    const result = await closeFixture(fixture);

    assert.equal(result.carga.situacao, SituacaoCarga.FECHADA);
    const foto = await listFoto(fixture.cargaId);
    assert.equal(foto.length, 1);
    const [item] = foto;
    assert.ok(item);
    assert.equal(item.ibcInvalido, true);
    assert.equal(item.quantidadeEsperadaTotal, 0);
    assert.equal(item.quantidadeEsperadaVenda, 0);
    assert.equal(item.quantidadeEsperadaEmprestimo, 0);
  });

  it("closes a carga without IBC and records no foto", async () => {
    const fixture = await createOpenCargaFixture(COD_CAR_SEM_IBC, [
      buildRow(COD_CAR_SEM_IBC, "29500301"),
    ]);

    const result = await closeFixture(fixture);

    assert.equal(result.carga.situacao, SituacaoCarga.FECHADA);
    assert.equal((await listFoto(fixture.cargaId)).length, 0);
  });

  it("rolls back the carga and the foto together when the close transaction fails", async () => {
    const fixture = await createOpenCargaFixture(COD_CAR_ROLLBACK, [
      buildRow(COD_CAR_ROLLBACK, "29500401", ibcLine(1000, 1000, "S")),
    ]);

    await assert.rejects(
      () => closeFixture(fixture, `${FIXTURE_PREFIX}missing-truck`),
      (error: { code?: string }) => error.code === "P2003",
    );

    const carga = await prisma.cargas.findUnique({
      where: { id: fixture.cargaId },
    });
    assert.ok(carga);
    assert.equal(carga.situacao, "ABERTA");
    assert.equal((await listFoto(fixture.cargaId)).length, 0);
  });
});
