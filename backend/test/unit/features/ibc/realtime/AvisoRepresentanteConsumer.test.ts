import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EventBroker, EventHandler } from "../../../../../src/features/events/eventBroker";
import { AvisoRepresentanteConsumer } from "../../../../../src/features/ibc/realtime/AvisoRepresentanteConsumer";
import type { GerarAvisosRepresentanteInput } from "../../../../../src/features/ibc/useCases/GerarAvisosRepresentante.use-case";

const EVENTO = {
  eventId: "11111111-1111-4111-8111-111111111111",
  eventType: "ViagemIbcFechada" as const,
  occurredAt: "2026-10-13T12:00:00.000Z",
  payload: {
    expedicaoIbcId: "22222222-2222-4222-8222-222222222222",
    codCar: 39039,
    fechadaPorId: "33333333-3333-4333-8333-333333333333",
    fechadaEm: "2026-10-13T12:00:00.000Z",
    ficaram: [
      {
        ibcId: "44444444-4444-4444-8444-444444444444",
        identificador: "HM00001",
        modalidade: "EMPRESTIMO" as const,
        codCli: "C1",
        cliente: "Cliente W",
        numPed: "100",
      },
    ],
  },
};

function criarBroker(): EventBroker & {
  fila?: string;
  routingKey?: string;
  handler?: EventHandler;
} {
  const captura: { fila?: string; routingKey?: string; handler?: EventHandler } = {};
  return {
    ...captura,
    publish: async () => undefined,
    consume: async (fila, handler, routingKey) => {
      captura.fila = fila;
      captura.routingKey = routingKey;
      captura.handler = handler;
    },
    close: async () => undefined,
    get fila() {
      return captura.fila;
    },
    get routingKey() {
      return captura.routingKey;
    },
    get handler() {
      return captura.handler;
    },
  };
}

describe("AvisoRepresentanteConsumer", () => {
  it("assina viagem.ibc.fechada, delega o payload e resolve para o ack", async () => {
    const broker = criarBroker();
    const chamadas: GerarAvisosRepresentanteInput[] = [];
    const consumer = new AvisoRepresentanteConsumer(
      broker,
      {
        execute: async (input) => {
          chamadas.push(input);
          return { inseridos: 1 };
        },
      },
      "workapool.ibc.viagem-fechada",
    );

    await consumer.start();
    assert.equal(broker.fila, "workapool.ibc.viagem-fechada");
    assert.equal(broker.routingKey, "viagem.ibc.fechada");
    await broker.handler?.(EVENTO);

    assert.deepEqual(chamadas, [
      {
        eventId: EVENTO.eventId,
        expedicaoIbcId: EVENTO.payload.expedicaoIbcId,
        codCar: EVENTO.payload.codCar,
        ficaram: EVENTO.payload.ficaram,
      },
    ]);
  });

  it("rejeita outro tipo de evento antes de gerar avisos", async () => {
    const broker = criarBroker();
    let chamadas = 0;
    const consumer = new AvisoRepresentanteConsumer(
      broker,
      {
        execute: async () => {
          chamadas += 1;
          return { inseridos: 0 };
        },
      },
      "workapool.ibc.viagem-fechada",
    );

    await consumer.start();
    await assert.rejects(() =>
      broker.handler?.({ ...EVENTO, eventType: "CARGA_FECHADA" }),
    );
    assert.equal(chamadas, 0);
  });
});
