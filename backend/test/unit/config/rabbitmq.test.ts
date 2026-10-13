import assert from "node:assert/strict";
import test from "node:test";
import { getRabbitMqConfig } from "../../../src/config/rabbitmq";

const required = {
  RABBITMQ_HOST: "localhost",
  RABBITMQ_PORT: "5672",
  RABBITMQ_USER: "workapool",
  RABBITMQ_PASSWORD: "secret",
  RABBITMQ_VHOST: "workapool",
};

test("fila de aviso do IBC usa o default e respeita RABBITMQ_IBC_AVISO_QUEUE", () => {
  assert.equal(
    getRabbitMqConfig(required).ibcAvisoQueue,
    "workapool.ibc.viagem-fechada",
  );
  assert.equal(
    getRabbitMqConfig({
      ...required,
      RABBITMQ_IBC_AVISO_QUEUE: "fila.custom.viagem",
    }).ibcAvisoQueue,
    "fila.custom.viagem",
  );
  assert.equal(
    getRabbitMqConfig(required).ibcQueue,
    "workapool.ibc.carga-fechada",
  );
});
