import amqp from "amqplib";
import type { ChannelModel, ConfirmChannel, ConsumeMessage } from "amqplib";
import { getRabbitMqConfig } from "../../config/rabbitmq";
import type { RabbitMqConfig } from "../../config/rabbitmq";
import type { DomainEvent } from "./domainEvents";
import type { EventBroker, EventHandler } from "./eventBroker";

export class RabbitMqEventBroker implements EventBroker {
  private readonly config: RabbitMqConfig;
  private channel: ConfirmChannel | null = null;
  private connection: ChannelModel | null = null;

  constructor(config?: RabbitMqConfig) {
    this.config = config ?? getRabbitMqConfig();
  }

  async connect(): Promise<void> {
    const channel = await this.getChannel();
    await this.assertTopology(channel);
  }

  async publish(event: DomainEvent, routingKey: string): Promise<void> {
    const channel = await this.getChannel();
    await this.assertTopology(channel);

    channel.publish(
      this.config.exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: "application/json",
        type: event.eventType,
      },
    );
    await channel.waitForConfirms();
  }

  async consume(queue: string, handler: EventHandler): Promise<void> {
    const channel = await this.getChannel();
    await this.assertTopology(channel, queue);

    await channel.consume(queue, async (message) => {
      if (!message) return;

      const retryCount = this.getRetryCount(message);
      try {
        const event = JSON.parse(message.content.toString()) as unknown;
        await handler(event);
        channel.ack(message);
      } catch (error: unknown) {
        await this.handleFailedMessage(channel, message, retryCount, error);
      }
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = null;
    this.connection = null;
  }

  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) return this.channel;

    const connection = await amqp.connect(this.buildUrl());
    this.connection = connection;
    connection.on("error", (error: Error) => {
      console.error("RabbitMQ connection error:", error.message);
      this.resetConnection(connection);
    });
    connection.on("close", () => {
      this.resetConnection(connection);
    });
    this.channel = await connection.createConfirmChannel();
    return this.channel;
  }

  private resetConnection(connection: ChannelModel): void {
    if (this.connection !== connection) return;
    this.connection = null;
    this.channel = null;
  }

  private buildUrl(): string {
    const vhost = this.config.vhost.replace(/^\/+/, "");
    return `amqp://${encodeURIComponent(this.config.user)}:${encodeURIComponent(
      this.config.password,
    )}@${this.config.host}:${this.config.port}/${encodeURIComponent(vhost)}`;
  }

  private async assertTopology(
    channel: ConfirmChannel,
    queue = this.config.ibcQueue,
  ): Promise<void> {
    await channel.assertExchange(this.config.exchange, "topic", {
      durable: true,
    });
    await channel.assertExchange(this.config.deadLetterExchange, "direct", {
      durable: true,
    });
    await channel.assertQueue(this.config.ibcDeadLetterQueue, {
      durable: true,
    });
    await channel.bindQueue(
      this.config.ibcDeadLetterQueue,
      this.config.deadLetterExchange,
      "carga.fechada",
    );
    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": this.config.deadLetterExchange,
        "x-dead-letter-routing-key": "carga.fechada",
      },
    });
    await channel.bindQueue(
      queue,
      this.config.exchange,
      "carga.fechada",
    );
  }

  private getRetryCount(message: ConsumeMessage): number {
    const value = message.properties.headers?.["x-retry-count"];
    const retryCount = Number(value);
    return Number.isInteger(retryCount) && retryCount >= 0 ? retryCount : 0;
  }

  private async handleFailedMessage(
    channel: ConfirmChannel,
    message: ConsumeMessage,
    retryCount: number,
    error: unknown,
  ): Promise<void> {
    const nextRetryCount = retryCount + 1;
    const targetExchange =
      nextRetryCount > this.config.maxConsumerRetries
        ? this.config.deadLetterExchange
        : this.config.exchange;
    const targetKey = "carga.fechada";

    try {
      channel.publish(targetExchange, targetKey, message.content, {
        persistent: true,
        contentType: message.properties.contentType,
        headers: {
          ...message.properties.headers,
          "x-retry-count": nextRetryCount,
          "x-last-error":
            error instanceof Error ? error.message : "Erro desconhecido",
        },
      });
      await channel.waitForConfirms();
      channel.ack(message);
    } catch (republishError: unknown) {
      console.error("Falha ao reagendar mensagem RabbitMQ:", republishError);
      channel.nack(message, false, true);
    }
  }
}
