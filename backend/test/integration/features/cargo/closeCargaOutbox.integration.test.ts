import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, before, describe, it } from "node:test";
import { PrismaClient, Role } from "@prisma/client";
import { Carga, SituacaoCarga } from "../../../../src/features/cargo/entities/Carga";
import { CargoRepository } from "../../../../src/features/cargo/repositories/CargoRepository";
import { CloseCargaUseCase } from "../../../../src/features/cargo/useCases/CloseCarga.use-case";
import { domainEvents } from "../../../../src/features/events/domainEvents";
import { PedidoService } from "../../../../src/features/pedidos/services/PedidoService";
import { PedidoRaw } from "../../../../src/features/pedidos/types/PedidoRaw";
import { FakeSapiens } from "../../../helpers/FakeSapiens";
import { ensureCargaDespachoSchema } from "../../../helpers/ensureCargaDespachoSchema";
import { ensureTrucksFleetSchema } from "../../../helpers/ensureTrucksFleetSchema";

const FIXTURE_PREFIX = "test-outbox-74-";
const FIXTURE_PLATE = "TO7400";
const COD_CAR_USE_CASE = 74001;
const COD_CAR_REPOSITORY = 74002;
const COD_CAR_ROLLBACK = 74003;
const FIXTURE_COD_CARS = [COD_CAR_USE_CASE, COD_CAR_REPOSITORY, COD_CAR_ROLLBACK];

const prisma = new PrismaClient();

class SapiensValidatedCargoRepository extends CargoRepository {
  constructor(private readonly sapiens: FakeSapiens) {
    super(sapiens, prisma);
  }

  async validarCargaSapiens(numPed: number): Promise<boolean> {
    return this.sapiens.validarCargaSapiens(numPed);
  }
}

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

const buildPedidoRow = (codCar: number): PedidoRaw => ({
  NUM_PED: String(codCar),
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
  CODCAR: codCar,
  POSCAR: 1,
  SITCAR: "A",
  QTD_ORI_PED: 1,
});

type Fixture = {
  cargaId: string;
  codCar: number;
  truckId: string;
  userId: string;
  sapiens: FakeSapiens;
};

async function createOpenCargaFixture(codCar: number): Promise<Fixture> {
  const cargaId = randomUUID();
  const previsaoSaida = new Date("2026-10-06T10:00:00.000Z");
  const user = await prisma.user.create({
    data: {
      user: `${FIXTURE_PREFIX}${codCar}`,
      password: "hashed",
      role: Role.LOGISTICA,
      name: "Logistica Outbox",
    },
  });
  const truck = await prisma.trucks.create({
    data: {
      name: `Truck Outbox ${codCar}`,
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
    rows: [buildPedidoRow(codCar)],
  });

  return { cargaId, codCar, truckId: truck.id, userId: user.id, sapiens };
}

async function cleanupFixtures(): Promise<void> {
  const cargas = await prisma.cargas.findMany({
    where: { codCar: { in: FIXTURE_COD_CARS } },
    select: { id: true },
  });
  const cargaIds = cargas.map((carga) => carga.id);

  await prisma.cargaDespacho.deleteMany({ where: { cargaId: { in: cargaIds } } });
  await prisma.cargasFechadas.deleteMany({ where: { cargaId: { in: cargaIds } } });
  await prisma.outboxEvent.deleteMany({ where: { aggregateId: { in: cargaIds } } });
  await prisma.cargas.deleteMany({ where: { id: { in: cargaIds } } });
  await prisma.trucks.deleteMany({ where: { plate: { startsWith: FIXTURE_PLATE } } });
  await prisma.user.deleteMany({ where: { user: { startsWith: FIXTURE_PREFIX } } });
}

describe("Cargo close writes CARGA_FECHADA to the Outbox (#74)", () => {
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

  it("closing a valid cargo through CloseCargaUseCase creates a CARGA_FECHADA event with cargo UUID and codCar", async () => {
    const fixture = await createOpenCargaFixture(COD_CAR_USE_CASE);
    const repository = new SapiensValidatedCargoRepository(fixture.sapiens);
    const useCase = new CloseCargaUseCase(
      repository,
      new PedidoService(fixture.sapiens),
    );

    const result = await useCase.execute({
      codCar: fixture.codCar,
      caminhaoId: fixture.truckId,
      fechadoPorId: fixture.userId,
    });

    assert.equal(result.carga.situacao, SituacaoCarga.FECHADA);

    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: fixture.cargaId },
    });
    assert.equal(events.length, 1);
    const [event] = events;
    assert.ok(event);
    assert.equal(event.eventType, domainEvents.EVENT_TYPES.CARGA_FECHADA);
    assert.equal(event.aggregateType, "Cargas");
    assert.equal(event.publishedAt, null);
    assert.deepEqual(event.payload, {
      cargaId: fixture.cargaId,
      codCar: fixture.codCar,
    });

    const parsed = domainEvents.cargoClosedEventSchema.safeParse({
      eventId: event.id,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      payload: event.payload,
    });
    assert.equal(parsed.success, true);
  });

  it("commits the cargo update and the OutboxEvent together", async () => {
    const fixture = await createOpenCargaFixture(COD_CAR_REPOSITORY);
    const repository = new CargoRepository(fixture.sapiens, prisma);

    await repository.closeCarga({
      codCar: fixture.codCar,
      caminhaoId: fixture.truckId,
      fechadoPorId: fixture.userId,
    });

    const carga = await prisma.cargas.findUnique({
      where: { id: fixture.cargaId },
    });
    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: fixture.cargaId },
    });
    const despacho = await prisma.cargaDespacho.findUnique({
      where: { cargaId: fixture.cargaId },
    });

    assert.ok(carga);
    assert.equal(carga.situacao, "FECHADA");
    assert.ok(carga.closedAt);
    assert.ok(event);
    assert.ok(despacho);
    assert.equal(event.occurredAt.getTime(), carga.closedAt.getTime());
    assert.equal(despacho.fechadoEm.getTime(), carga.closedAt.getTime());
  });

  it("rolls back the cargo update and leaves no OutboxEvent when the close transaction fails", async () => {
    const fixture = await createOpenCargaFixture(COD_CAR_ROLLBACK);
    const repository = new CargoRepository(fixture.sapiens, prisma);

    await assert.rejects(
      () =>
        repository.closeCarga({
          codCar: fixture.codCar,
          caminhaoId: `${FIXTURE_PREFIX}missing-truck`,
          fechadoPorId: fixture.userId,
        }),
      (error: { code?: string }) => error.code === "P2003",
    );

    const carga = await prisma.cargas.findUnique({
      where: { id: fixture.cargaId },
    });
    const events = await prisma.outboxEvent.count({
      where: {
        aggregateId: fixture.cargaId,
        eventType: domainEvents.EVENT_TYPES.CARGA_FECHADA,
      },
    });
    const despachos = await prisma.cargaDespacho.count({
      where: { cargaId: fixture.cargaId },
    });

    assert.ok(carga);
    assert.equal(carga.situacao, "ABERTA");
    assert.equal(carga.closedAt, null);
    assert.equal(events, 0);
    assert.equal(despachos, 0);
  });
});
