import amqp from "amqplib";
import type { Channel, ChannelModel, GetMessage } from "amqplib";
import { getRabbitMqConfig } from "../../src/config/rabbitmq";
import type { RabbitMqConfig } from "../../src/config/rabbitmq";

export type RabbitMqTestChannel = {
  config: RabbitMqConfig;
  purgeIbcQueues(): Promise<void>;
  getMessage(queue: string): Promise<GetMessage | null>;
  messageCount(queue: string): Promise<number>;
  publishRaw(routingKey: string, content: string): Promise<void>;
  close(): Promise<void>;
};

function buildUrl(config: RabbitMqConfig): string {
  const vhost = config.vhost.replace(/^\/+/, "");
  return `amqp://${encodeURIComponent(config.user)}:${encodeURIComponent(
    config.password,
  )}@${config.host}:${config.port}/${encodeURIComponent(vhost)}`;
}

export async function openRabbitMqTestChannel(): Promise<RabbitMqTestChannel> {
  const config = getRabbitMqConfig();
  if (!config.vhost.includes("test")) {
    throw new Error(
      `RabbitMQ integration tests require a test vhost, received ${config.vhost}`,
    );
  }

  let connection: ChannelModel;
  try {
    connection = await amqp.connect(buildUrl(config));
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `RabbitMQ de teste indisponível em ${config.host}:${config.port} (${reason}). ` +
        "Suba com: docker compose --env-file backend/.env.test --profile test up -d rabbitmq-test",
    );
  }
  const channel: Channel = await connection.createChannel();

  return {
    config,
    async purgeIbcQueues(): Promise<void> {
      for (const queue of [config.ibcQueue, config.ibcDeadLetterQueue]) {
        const exists = await channel
          .checkQueue(queue)
          .then(() => true)
          .catch(() => false);
        if (exists) await channel.purgeQueue(queue);
      }
    },
    async getMessage(queue: string): Promise<GetMessage | null> {
      const message = await channel.get(queue, { noAck: true });
      return message === false ? null : message;
    },
    async messageCount(queue: string): Promise<number> {
      const { messageCount } = await channel.checkQueue(queue);
      return messageCount;
    },
    async publishRaw(routingKey: string, content: string): Promise<void> {
      channel.publish(config.exchange, routingKey, Buffer.from(content), {
        persistent: true,
        contentType: "application/json",
      });
    },
    async close(): Promise<void> {
      await channel.close();
      await connection.close();
    },
  };
}

export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
  intervalMs = 50,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Condição não atendida em ${timeoutMs}ms`);
}
