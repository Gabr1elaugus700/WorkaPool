import test from "node:test";
import assert from "node:assert/strict";
import type {
  EventBroker,
  EventHandler,
} from "../../../../src/features/events/eventBroker";
import type {
  CargoClosedEvent,
  DomainEvent,
} from "../../../../src/features/events/domainEvents";
import type { OutboxStore } from "../../../../src/features/events/outboxPublisher";
import type { OutboxEventRecord } from "../../../../src/features/events/outboxRepository";
import { OutboxPublisher } from "../../../../src/features/events/outboxPublisher";
import { IbcEventConsumer } from "../../../../src/features/ibc/realtime/IbcEventConsumer";
import type { IbcSseGateway } from "../../../../src/features/ibc/realtime/ibcSseGateway";

const cargoClosedEvent: CargoClosedEvent = {
  eventId: "11111111-1111-4111-8111-111111111111",
  eventType: "CARGA_FECHADA",
  occurredAt: "2026-08-28T11:00:00.000Z",
  payload: {
    cargaId: "22222222-2222-4222-8222-222222222222",
    codCar: 11,
  },
};

const pendingEvent: OutboxEventRecord = {
  id: cargoClosedEvent.eventId,
  eventType: cargoClosedEvent.eventType,
  aggregateType: "Cargas",
  aggregateId: cargoClosedEvent.payload.cargaId,
  payload: cargoClosedEvent.payload,
  occurredAt: new Date(cargoClosedEvent.occurredAt),
  createdAt: new Date(cargoClosedEvent.occurredAt),
  publishedAt: null,
  attempts: 0,
  lastError: null,
  lockedAt: null,
};

test("OutboxPublisher publica evento e marca publishedAt somente após confirmação", async () => {
  let published: DomainEvent | null = null;
  let markedPublished = false;
  const outbox: OutboxStore = {
    claimNext: async () => pendingEvent,
    markPublished: async () => {
      markedPublished = true;
    },
    markFailed: async () => {
      throw new Error("markFailed não deveria ser chamado");
    },
  };
  const broker: EventBroker = {
    publish: async (event) => {
      published = event;
    },
    consume: async () => undefined,
    close: async () => undefined,
  };

  const result = await new OutboxPublisher(outbox, broker).publishOnce();

  assert.equal(result, true);
  assert.deepEqual(published, cargoClosedEvent);
  assert.equal(markedPublished, true);
});

test("OutboxPublisher mantém evento pendente e registra falha quando RabbitMQ rejeita", async () => {
  let markedFailed: unknown = null;
  const outbox: OutboxStore = {
    claimNext: async () => pendingEvent,
    markPublished: async () => {
      throw new Error("markPublished não deveria ser chamado");
    },
    markFailed: async (_id, error) => {
      markedFailed = error;
    },
  };
  const broker: EventBroker = {
    publish: async () => {
      throw new Error("broker indisponível");
    },
    consume: async () => undefined,
    close: async () => undefined,
  };

  const result = await new OutboxPublisher(outbox, broker).publishOnce();

  assert.equal(result, false);
  assert.ok(markedFailed instanceof Error);
  assert.equal(markedFailed.message, "broker indisponível");
});

test("IbcEventConsumer processa CARGA_FECHADA uma vez por eventId", async () => {
  let handler: EventHandler | undefined;
  const broker: EventBroker = {
    publish: async () => undefined,
    consume: async (_queue, receivedHandler) => {
      handler = receivedHandler;
    },
    close: async () => undefined,
  };
  const processed = new Set<string>();
  const notifications: CargoClosedEvent[] = [];
  const gateway: IbcSseGateway = {
    addClient: () => () => undefined,
    broadcast: (event) => {
      notifications.push(event);
    },
  };

  const consumer = new IbcEventConsumer(
    broker,
    {
      tryMarkProcessed: async (_consumerName, eventId) => {
        if (processed.has(eventId)) return false;
        processed.add(eventId);
        return true;
      },
    },
    gateway,
  );

  await consumer.start();
  assert.ok(handler);
  await handler(cargoClosedEvent);
  await handler(cargoClosedEvent);

  assert.equal(processed.size, 1);
  assert.equal(notifications.length, 1);
  assert.deepEqual(notifications[0], cargoClosedEvent);
});
