import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import type { CargoClosedEvent } from "../../../../src/features/events/domainEvents";
import type { EventBroker } from "../../../../src/features/events/eventBroker";
import { OutboxPublisher } from "../../../../src/features/events/outboxPublisher";
import { OutboxRepository } from "../../../../src/features/events/outboxRepository";
import { RabbitMqEventBroker } from "../../../../src/features/events/rabbitMqEventBroker";
import { ensureCargaDespachoSchema } from "../../../helpers/ensureCargaDespachoSchema";
import {
  openRabbitMqTestChannel,
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
});
