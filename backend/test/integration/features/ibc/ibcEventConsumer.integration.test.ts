import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import type { CargoClosedEvent } from "../../../../src/features/events/domainEvents";
import { RabbitMqEventBroker } from "../../../../src/features/events/rabbitMqEventBroker";
import {
  IbcEventConsumer,
  type ProcessedEventStore,
} from "../../../../src/features/ibc/realtime/IbcEventConsumer";
import type { IbcSseGateway } from "../../../../src/features/ibc/realtime/ibcSseGateway";
import { ProcessedEventRepository } from "../../../../src/features/ibc/repositories/ProcessedEventRepository";
import { ensureProcessedEventSchema } from "../../../helpers/ensureProcessedEventSchema";
import {
  openRabbitMqTestChannel,
  waitFor,
  type RabbitMqTestChannel,
} from "../../../helpers/rabbitMqTestChannel";

const CONSUMER_NAME = "IBC_SSE";

const prisma = new PrismaClient();

function assertTestDatabase(): void {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  if (databaseUrl.pathname !== "/workapool_test") {
    throw new Error(
      `Integration tests require workapool_test, received ${databaseUrl.pathname}`,
    );
  }
}

function buildEvent(): CargoClosedEvent {
  return {
    eventId: randomUUID(),
    eventType: "CARGA_FECHADA",
    occurredAt: "2026-10-05T12:00:00.000Z",
    payload: { cargaId: randomUUID(), codCar: 74200 },
  };
}

function createSpyGateway(): IbcSseGateway & {
  notifications: CargoClosedEvent[];
} {
  const notifications: CargoClosedEvent[] = [];
  return {
    notifications,
    addClient: () => () => undefined,
    broadcast: (event) => {
      notifications.push(event);
    },
  };
}

describe("RabbitMQ delivery and IBC consumer (#74)", () => {
  let rabbit: RabbitMqTestChannel;
  let publisherBroker: RabbitMqEventBroker;
  let consumerBroker: RabbitMqEventBroker;
  const eventIds: string[] = [];

  const trackEvent = (event: CargoClosedEvent): CargoClosedEvent => {
    eventIds.push(event.eventId);
    return event;
  };

  const startConsumer = async (
    gateway: IbcSseGateway,
    processedEvents: ProcessedEventStore = new ProcessedEventRepository(prisma),
  ): Promise<IbcEventConsumer> => {
    const consumer = new IbcEventConsumer(
      consumerBroker,
      processedEvents,
      gateway,
      rabbit.config.ibcQueue,
    );
    await consumer.start();
    return consumer;
  };

  const processedCount = (eventId: string): Promise<number> =>
    prisma.processedEvent.count({
      where: { consumerName: CONSUMER_NAME, eventId },
    });

  before(async () => {
    assertTestDatabase();
    await ensureProcessedEventSchema(prisma);
    rabbit = await openRabbitMqTestChannel();
  });

  beforeEach(async () => {
    publisherBroker = new RabbitMqEventBroker();
    consumerBroker = new RabbitMqEventBroker();
    await publisherBroker.connect();
    await rabbit.purgeIbcQueues();
  });

  afterEach(async () => {
    await consumerBroker.close();
    await publisherBroker.close();
    await prisma.processedEvent.deleteMany({
      where: { eventId: { in: eventIds.splice(0) } },
    });
  });

  after(async () => {
    await rabbit.purgeIbcQueues();
    await rabbit.close();
    await prisma.$disconnect();
  });

  it("routes CARGA_FECHADA published with carga.fechada to the IBC queue", async () => {
    const event = trackEvent(buildEvent());

    await publisherBroker.publish(event, "carga.fechada");

    const message = await rabbit.getMessage(rabbit.config.ibcQueue);
    assert.ok(message, "IBC queue should receive the event");
    assert.equal(message.properties.type, "CARGA_FECHADA");
    assert.deepEqual(JSON.parse(message.content.toString()), event);
  });

  it("processes CARGA_FECHADA once: records ProcessedEvent, emits one notification and acks", async () => {
    const event = trackEvent(buildEvent());
    const gateway = createSpyGateway();
    await startConsumer(gateway);

    await publisherBroker.publish(event, "carga.fechada");
    await waitFor(() => gateway.notifications.length === 1);
    await consumerBroker.close();

    assert.deepEqual(gateway.notifications, [event]);
    assert.equal(await processedCount(event.eventId), 1);
    assert.equal(await rabbit.messageCount(rabbit.config.ibcQueue), 0);
  });

  it("ignores a duplicate delivery of the same CARGA_FECHADA and acks it safely", async () => {
    const event = trackEvent(buildEvent());
    const gateway = createSpyGateway();
    const repository = new ProcessedEventRepository(prisma);
    const deliveries: boolean[] = [];
    await startConsumer(gateway, {
      tryMarkProcessed: async (consumerName, eventId) => {
        const shouldProcess = await repository.tryMarkProcessed(
          consumerName,
          eventId,
        );
        deliveries.push(shouldProcess);
        return shouldProcess;
      },
    });

    await publisherBroker.publish(event, "carga.fechada");
    await publisherBroker.publish(event, "carga.fechada");
    await waitFor(() => deliveries.length === 2);
    await consumerBroker.close();

    assert.deepEqual(deliveries, [true, false]);
    assert.equal(gateway.notifications.length, 1);
    assert.equal(await processedCount(event.eventId), 1);
    assert.equal(await rabbit.messageCount(rabbit.config.ibcQueue), 0);
  });

  it("makes the message available again after a transient processing failure", async () => {
    const event = trackEvent(buildEvent());
    const gateway = createSpyGateway();
    const repository = new ProcessedEventRepository(prisma);
    let attempts = 0;
    await startConsumer(gateway, {
      tryMarkProcessed: async (consumerName, eventId) => {
        attempts += 1;
        if (attempts === 1) throw new Error("PostgreSQL indisponível");
        return repository.tryMarkProcessed(consumerName, eventId);
      },
    });

    await publisherBroker.publish(event, "carga.fechada");
    await waitFor(() => gateway.notifications.length === 1);
    await consumerBroker.close();

    assert.equal(attempts, 2);
    assert.deepEqual(gateway.notifications, [event]);
    assert.equal(await processedCount(event.eventId), 1);
    assert.equal(await rabbit.messageCount(rabbit.config.ibcQueue), 0);
    assert.equal(await rabbit.messageCount(rabbit.config.ibcDeadLetterQueue), 0);
  });

  it("routes a poison message to the DLQ after exceeding the retry limit", async () => {
    const gateway = createSpyGateway();
    await startConsumer(gateway);
    const poison = JSON.stringify({
      eventId: "not-a-uuid",
      eventType: "CARGA_FECHADA",
      occurredAt: "2026-10-05T12:00:00.000Z",
      payload: { cargaId: "not-a-uuid", codCar: -1 },
    });

    await rabbit.publishRaw("carga.fechada", poison);
    await waitFor(
      async () =>
        (await rabbit.messageCount(rabbit.config.ibcDeadLetterQueue)) === 1,
    );
    await consumerBroker.close();

    const deadLetter = await rabbit.getMessage(rabbit.config.ibcDeadLetterQueue);
    assert.ok(deadLetter, "poison message should be kept in the DLQ");
    assert.equal(deadLetter.content.toString(), poison);
    assert.equal(
      deadLetter.properties.headers?.["x-retry-count"],
      rabbit.config.maxConsumerRetries + 1,
    );
    assert.equal(typeof deadLetter.properties.headers?.["x-last-error"], "string");
    assert.equal(gateway.notifications.length, 0);
    assert.equal(await rabbit.messageCount(rabbit.config.ibcQueue), 0);
  });
});
