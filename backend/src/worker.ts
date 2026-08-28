import "./config/env";
import { RabbitMqEventBroker } from "./features/events/rabbitMqEventBroker";
import { OutboxPublisher } from "./features/events/outboxPublisher";
import { OutboxRepository } from "./features/events/outboxRepository";

async function main(): Promise<void> {
  const broker = new RabbitMqEventBroker();
  const publisher = new OutboxPublisher(
    new OutboxRepository(),
    broker,
  );
  await broker.connect();

  const shutdown = async (): Promise<void> => {
    publisher.stop();
    await broker.close();
  };

  process.once("SIGTERM", () => {
    void shutdown();
  });
  process.once("SIGINT", () => {
    void shutdown();
  });

  console.log("Outbox worker iniciado");
  await publisher.start();
}

void main().catch((error: unknown) => {
  console.error(
    "Não foi possível iniciar o Outbox worker:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
