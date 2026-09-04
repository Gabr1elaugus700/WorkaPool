import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import { PrismaClient, Role } from "@prisma/client";
import { Carga, SituacaoCarga } from "../../../../src/features/cargo/entities/Carga";
import { CargoRepository } from "../../../../src/features/cargo/repositories/CargoRepository";
import { FakeSapiens } from "../../../helpers/FakeSapiens";
import { PedidoRaw } from "../../../../src/features/pedidos/types/PedidoRaw";
import { ensureCargaDespachoSchema } from "../../../helpers/ensureCargaDespachoSchema";
import { ensureTrucksFleetSchema } from "../../../helpers/ensureTrucksFleetSchema";

const FIXTURE_PREFIX = "test-close-90-";
const FIXTURE_COD_CAR = 90001;
const FIXTURE_PLATE = "TC9001";

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

const buildPedidoRow = (overrides: Partial<PedidoRaw> = {}): PedidoRaw => ({
  NUM_PED: "90001",
  COD_CLI: "C1",
  CLIENTE: "Cliente Teste",
  CIDADE: "Blumenau",
  ESTADO: "SC",
  VENDEDOR: "Vendedor Teste",
  CODREP: 1,
  BLOQUEADO: "N",
  PESO: 200,
  PRODUTOS: "Produto",
  DERIVACAO: "001",
  QUANTIDADE: 1,
  CODCAR: FIXTURE_COD_CAR,
  POSCAR: 1,
  SITCAR: "A",
  QTD_ORI_PED: 1,
  ...overrides,
});

async function cleanupFixtures(): Promise<void> {
  const like = `${FIXTURE_PREFIX}%`;
  await prisma.$executeRawUnsafe(
    `DELETE FROM "CargaDespacho" WHERE "cargaId" LIKE '${like}'`,
  ).catch(() => undefined);
  await prisma.cargasFechadas
    .deleteMany({
      where: { cargaId: { startsWith: FIXTURE_PREFIX } },
    })
    .catch(() => undefined);
  await prisma.$executeRawUnsafe(
    `DELETE FROM "OutboxEvent" WHERE "aggregateId" LIKE '${like}'`,
  ).catch(() => undefined);
  await prisma.cargas.deleteMany({
    where: { id: { startsWith: FIXTURE_PREFIX } },
  });
  await prisma.trucks.deleteMany({
    where: { plate: FIXTURE_PLATE },
  });
  await prisma.user.deleteMany({
    where: { user: { startsWith: FIXTURE_PREFIX } },
  });
}

describe("Close cargo persists CargaDespacho without motorista (#90)", () => {
  before(async () => {
    assertTestDatabase();
    await ensureTrucksFleetSchema(prisma);
    await ensureCargaDespachoSchema(prisma);
    await cleanupFixtures();
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("closeCarga stores dispatch linked to cargo and truck with no motoristaId column", async () => {
    const cargaId = `${FIXTURE_PREFIX}carga`;
    const user = await prisma.user.create({
      data: {
        user: `${FIXTURE_PREFIX}logistica`,
        password: "hashed",
        role: Role.LOGISTICA,
        name: "Logistica Teste",
      },
    });
    const truck = await prisma.trucks.create({
      data: {
        name: "Truck Close 90",
        capacity: 20000,
        plate: FIXTURE_PLATE,
        active: true,
      },
    });
    await prisma.cargas.create({
      data: {
        id: cargaId,
        codCar: FIXTURE_COD_CAR,
        destino: "Blumenau",
        pesoMax: 10000,
        custoMin: 0,
        situacao: "ABERTA",
        previsaoSaida: new Date("2026-09-04T10:00:00.000Z"),
      },
    });

    const fakeSapiens = new FakeSapiens({
      cargas: [
        new Carga({
          id: cargaId,
          codCar: FIXTURE_COD_CAR,
          destino: "Blumenau",
          pesoMaximo: 10000,
          previsaoSaida: new Date("2026-09-04T10:00:00.000Z"),
          situacao: SituacaoCarga.ABERTA,
        }),
      ],
      rows: [buildPedidoRow()],
    });
    const repository = new CargoRepository(fakeSapiens, prisma);

    const result = await repository.closeCarga({
      codCar: FIXTURE_COD_CAR,
      caminhaoId: truck.id,
      fechadoPorId: user.id,
    });

    assert.equal(result.carga.situacao, SituacaoCarga.FECHADA);
    assert.equal(result.despacho.caminhaoId, truck.id);
    assert.equal(result.despacho.cargaId, cargaId);
    assert.equal("motoristaId" in result.despacho, false);

    const persisted = await prisma.cargaDespacho.findUnique({
      where: { cargaId },
    });
    assert.ok(persisted);
    assert.equal(persisted.caminhaoId, truck.id);
    assert.equal(persisted.fechadoPorId, user.id);
    assert.equal("motoristaId" in persisted, false);

    const motoristaColumns = await prisma.$queryRawUnsafe<
      Array<{ column_name: string }>
    >(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'CargaDespacho' AND column_name = 'motoristaId'`,
    );
    assert.equal(motoristaColumns.length, 0);
  });
});
