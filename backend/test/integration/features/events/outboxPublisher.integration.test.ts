import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import {
  domainEvents,
  type CargoClosedEvent,
  type ViagemIbcFechadaEvent,
} from "../../../../src/features/events/domainEvents";
import type { EventBroker } from "../../../../src/features/events/eventBroker";
import { OutboxPublisher } from "../../../../src/features/events/outboxPublisher";
import { OutboxRepository } from "../../../../src/features/events/outboxRepository";
import { RabbitMqEventBroker } from "../../../../src/features/events/rabbitMqEventBroker";
import { ensureCargaDespachoSchema } from "../../../helpers/ensureCargaDespachoSchema";
import {
  openRabbitMqTestChannel,
  waitFor,
  type RabbitMqTestChannel,
} from "../../../helpers/rabbitMqTestChannel";

const AGGREGATE_PREFIX = "test-publisher-74-";
const OLDEST_CREATED_AT = new Date("2000-01-01T00:00:00.000Z");

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

async function createPendingEvent(): Promise<CargoClosedEvent> {
  const event: CargoClosedEvent = {
    eventId: randomUUID(),
    eventType: "CARGA_FECHADA",
    occurredAt: "2026-10-05T12:00:00.000Z",
    payload: { cargaId: randomUUID(), codCar: 74100 },
  };
  await prisma.outboxEvent.create({
    data: {
      id: event.eventId,
      eventType: event.eventType,
      aggregateType: "Cargas",
      aggregateId: `${AGGREGATE_PREFIX}${event.payload.cargaId}`,
      payload: event.payload,
      occurredAt: new Date(event.occurredAt),
      createdAt: OLDEST_CREATED_AT,
    },
  });
  return event;
}

describe("OutboxPublisher with PostgreSQL and RabbitMQ (#74)", () => {
  let rabbit: RabbitMqTestChannel;
  let broker: RabbitMqEventBroker;

  before(async () => {
    assertTestDatabase();
    await ensureCargaDespachoSchema(prisma);
    rabbit = await openRabbitMqTestChannel();
  });

  beforeEach(async () => {
    broker = new RabbitMqEventBroker();
    await broker.connect();
    await rabbit.purgeIbcQueues();
  });

  afterEach(async () => {
    await broker.close();
    await prisma.outboxEvent.deleteMany({
      where: { aggregateId: { startsWith: AGGREGATE_PREFIX } },
    });
  });

  after(async () => {
    await rabbit.purgeIbcQueues();
    await rabbit.close();
    await prisma.$disconnect();
  });

  it("publishes a pending CARGA_FECHADA to the configured exchange and records publishedAt after confirmation", async () => {
    const event = await createPendingEvent();
    const publisher = new OutboxPublisher(new OutboxRepository(prisma), broker);

    const published = await publisher.publishOnce();

    assert.equal(published, true);
    const stored = await prisma.outboxEvent.findUnique({
      where: { id: event.eventId },
    });
    assert.ok(stored);
    assert.ok(stored.publishedAt instanceof Date);
    assert.equal(stored.lockedAt, null);
    assert.equal(stored.attempts, 0);

    const message = await rabbit.getMessage(rabbit.config.ibcQueue);
    assert.ok(message, "IBC queue should receive the published event");
    assert.equal(message.fields.exchange, rabbit.config.exchange);
    assert.equal(message.fields.routingKey, "carga.fechada");
    assert.deepEqual(JSON.parse(message.content.toString()), event);
    assert.equal(await rabbit.messageCount(rabbit.config.ibcAvisoQueue), 0);
  });

  it("keeps the event retryable when the broker rejects the publication", async () => {
    const event = await createPendingEvent();
    const rejectingBroker: EventBroker = {
      publish: async () => {
        throw new Error("RabbitMQ nack: publication rejected");
      },
      consume: async () => undefined,
      close: async () => undefined,
    };
    const publisher = new OutboxPublisher(
      new OutboxRepository(prisma),
      rejectingBroker,
    );

    const published = await publisher.publishOnce();

    assert.equal(published, false);
    const stored = await prisma.outboxEvent.findUnique({
      where: { id: event.eventId },
    });
    assert.ok(stored);
    assert.equal(stored.publishedAt, null);
    assert.equal(stored.attempts, 1);
    assert.equal(stored.lastError, "RabbitMQ nack: publication rejected");
    assert.equal(stored.lockedAt, null);
    assert.equal(await rabbit.messageCount(rabbit.config.ibcQueue), 0);
  });

  it("publishes ViagemIbcFechada to the aviso queue and leaves the carga queue empty", async () => {
    const event: ViagemIbcFechadaEvent = {
      eventId: randomUUID(),
      eventType: "ViagemIbcFechada",
      occurredAt: "2026-10-05T12:00:00.000Z",
      payload: {
        expedicaoIbcId: randomUUID(),
        codCar: 74101,
        fechadaPorId: randomUUID(),
        fechadaEm: "2026-10-05T12:00:00.000Z",
        ficaram: [
          {
            ibcId: randomUUID(),
            identificador: "HM0001",
            modalidade: "EMPRESTIMO",
            codCli: "10",
            cliente: "Cliente W",
            numPed: "100",
          },
        ],
      },
    };
    await prisma.outboxEvent.create({
      data: {
        id: event.eventId,
        eventType: event.eventType,
        aggregateType: "ExpedicaoIbc",
        aggregateId: `${AGGREGATE_PREFIX}${event.payload.expedicaoIbcId}`,
        payload: event.payload,
        occurredAt: new Date(event.occurredAt),
        createdAt: OLDEST_CREATED_AT,
      },
    });
    const publisher = new OutboxPublisher(new OutboxRepository(prisma), broker);

    const published = await publisher.publishOnce();

    assert.equal(published, true);
    const stored = await prisma.outboxEvent.findUnique({
      where: { id: event.eventId },
    });
    assert.ok(stored?.publishedAt instanceof Date);

    const message = await rabbit.getMessage(rabbit.config.ibcAvisoQueue);
    assert.ok(message, "aviso queue should receive the viagem event");
    assert.equal(message.fields.routingKey, "viagem.ibc.fechada");
    assert.equal(message.fields.exchange, rabbit.config.exchange);
    assert.deepEqual(JSON.parse(message.content.toString()), event);
    assert.equal(await rabbit.messageCount(rabbit.config.ibcQueue), 0);
  });

  it("does not redeliver an invalid viagem message as carga.fechada", async () => {
    const routingKey = "viagem.ibc.fechada";
    const poison = JSON.stringify({
      eventId: "not-a-uuid",
      eventType: "ViagemIbcFechada",
      occurredAt: "2026-10-05T12:00:00.000Z",
      payload: { ficaram: [{ modalidade: "TROCA" }] },
    });

    await broker.consume(
      rabbit.config.ibcAvisoQueue,
      async (raw) => {
        domainEvents.viagemIbcFechadaEventSchema.parse(raw);
      },
      routingKey,
    );
    await rabbit.publishRaw(routingKey, poison);

    await waitFor(async () => {
      if ((await rabbit.messageCount(rabbit.config.ibcQueue)) > 0) {
        throw new Error(
          "mensagem inválida de viagem foi reentregue na fila carga.fechada",
        );
      }
      return (await rabbit.messageCount(rabbit.config.ibcDeadLetterQueue)) === 1;
    });

    const deadLetter = await rabbit.getMessage(rabbit.config.ibcDeadLetterQueue);
    assert.ok(deadLetter, "poison viagem message should be kept in the DLQ");
    assert.equal(deadLetter.fields.routingKey, routingKey);
    assert.equal(deadLetter.content.toString(), poison);
    assert.equal(
      deadLetter.properties.headers?.["x-retry-count"],
      rabbit.config.maxConsumerRetries + 1,
    );
    assert.equal(await rabbit.messageCount(rabbit.config.ibcQueue), 0);
    assert.equal(await rabbit.messageCount(rabbit.config.ibcAvisoQueue), 0);
  });
});
