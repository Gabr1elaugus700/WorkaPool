import test from "node:test";
import assert from "node:assert/strict";
import type {
  EventBroker,
  EventHandler,
} from "../../../../src/features/events/eventBroker";
import {
  domainEvents,
  type CargoClosedEvent,
  type DomainEvent,
  type ViagemIbcFechadaEvent,
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
  let publishedKey: string | null = null;
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
    publish: async (event, routingKey) => {
      published = event;
      publishedKey = routingKey;
    },
    consume: async () => undefined,
    close: async () => undefined,
  };

  const result = await new OutboxPublisher(outbox, broker).publishOnce();

  assert.equal(result, true);
  assert.deepEqual(published, cargoClosedEvent);
  assert.equal(publishedKey, "carga.fechada");
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

const viagemFechadaEvent: ViagemIbcFechadaEvent = {
  eventId: "33333333-3333-4333-8333-333333333333",
  eventType: "ViagemIbcFechada",
  occurredAt: "2026-08-28T12:00:00.000Z",
  payload: {
    expedicaoIbcId: "44444444-4444-4444-8444-444444444444",
    codCar: 22,
    fechadaPorId: "55555555-5555-4555-8555-555555555555",
    fechadaEm: "2026-08-28T12:00:00.000Z",
    ficaram: [
      {
        ibcId: "66666666-6666-4666-8666-666666666666",
        identificador: "HM0001",
        modalidade: "EMPRESTIMO",
        codCli: "10",
        cliente: "Cliente W",
        numPed: "100",
      },
      {
        ibcId: "77777777-7777-4777-8777-777777777777",
        identificador: "HM0002",
        modalidade: "VENDA",
        codCli: null,
        cliente: "Cliente W",
        numPed: "101",
      },
    ],
  },
};

test("getRoutingKey mapeia carga fechada e viagem IBC fechada", () => {
  assert.equal(
    domainEvents.getRoutingKey(domainEvents.EVENT_TYPES.CARGA_FECHADA),
    "carga.fechada",
  );
  assert.equal(
    domainEvents.getRoutingKey(domainEvents.EVENT_TYPES.VIAGEM_IBC_FECHADA),
    "viagem.ibc.fechada",
  );
  assert.equal(domainEvents.EVENT_TYPES.VIAGEM_IBC_FECHADA, "ViagemIbcFechada");
  assert.throws(
    () => domainEvents.getRoutingKey("OUTRO"),
    /Tipo de evento sem routing key: OUTRO/,
  );
});

test("viagemIbcFechadaEventSchema aceita ficaram vazio e rejeita modalidade estranha", () => {
  const vazio = domainEvents.viagemIbcFechadaEventSchema.safeParse({
    ...viagemFechadaEvent,
    payload: { ...viagemFechadaEvent.payload, ficaram: [] },
  });
  assert.equal(vazio.success, true);

  const troca = domainEvents.viagemIbcFechadaEventSchema.safeParse({
    ...viagemFechadaEvent,
    payload: {
      ...viagemFechadaEvent.payload,
      ficaram: [
        {
          ...viagemFechadaEvent.payload.ficaram[0],
          modalidade: "TROCA",
        },
      ],
    },
  });
  assert.equal(troca.success, false);
});

test("OutboxPublisher publica ViagemIbcFechada na routing key da viagem", async () => {
  let published: DomainEvent | null = null;
  let publishedKey: string | null = null;
  const outbox: OutboxStore = {
    claimNext: async () => ({
      ...pendingEvent,
      id: viagemFechadaEvent.eventId,
      eventType: viagemFechadaEvent.eventType,
      aggregateType: "ExpedicaoIbc",
      aggregateId: viagemFechadaEvent.payload.expedicaoIbcId,
      payload: viagemFechadaEvent.payload,
      occurredAt: new Date(viagemFechadaEvent.occurredAt),
    }),
    markPublished: async () => undefined,
    markFailed: async () => {
      throw new Error("markFailed não deveria ser chamado");
    },
  };
  const broker: EventBroker = {
    publish: async (event, routingKey) => {
      published = event;
      publishedKey = routingKey;
    },
    consume: async () => undefined,
    close: async () => undefined,
  };

  const result = await new OutboxPublisher(outbox, broker).publishOnce();

  assert.equal(result, true);
  assert.deepEqual(published, viagemFechadaEvent);
  assert.equal(publishedKey, "viagem.ibc.fechada");
});

test("OutboxPublisher mantém ViagemIbcFechada pendente quando o payload não fecha o schema", async () => {
  let published = false;
  let markedFailed: unknown = null;
  const outbox: OutboxStore = {
    claimNext: async () => ({
      ...pendingEvent,
      eventType: "ViagemIbcFechada",
      payload: { ficaram: [{ modalidade: "TROCA" }] },
    }),
    markPublished: async () => {
      throw new Error("markPublished não deveria ser chamado");
    },
    markFailed: async (_id, error) => {
      markedFailed = error;
    },
  };
  const broker: EventBroker = {
    publish: async () => {
      published = true;
    },
    consume: async () => undefined,
    close: async () => undefined,
  };

  const result = await new OutboxPublisher(outbox, broker).publishOnce();

  assert.equal(result, false);
  assert.equal(published, false);
  assert.ok(markedFailed instanceof Error);
});
