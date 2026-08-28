export type RabbitMqConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  vhost: string;
  exchange: string;
  deadLetterExchange: string;
  ibcQueue: string;
  ibcDeadLetterQueue: string;
  maxConsumerRetries: number;
};

export function getRabbitMqConfig(
  environment: NodeJS.ProcessEnv = process.env,
): RabbitMqConfig {
  const required = [
    "RABBITMQ_HOST",
    "RABBITMQ_PORT",
    "RABBITMQ_USER",
    "RABBITMQ_PASSWORD",
    "RABBITMQ_VHOST",
  ] as const;
  const missing = required.filter((name) => !environment[name]);

  if (missing.length > 0) {
    throw new Error(
      `Configuração RabbitMQ ausente: ${missing.join(", ")}`,
    );
  }

  const port = Number(environment.RABBITMQ_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("RABBITMQ_PORT deve ser um número inteiro positivo");
  }

  const maxConsumerRetries = Number(environment.RABBITMQ_MAX_RETRIES ?? 3);
  if (!Number.isInteger(maxConsumerRetries) || maxConsumerRetries < 0) {
    throw new Error(
      "RABBITMQ_MAX_RETRIES deve ser um número inteiro não negativo",
    );
  }

  return {
    host: environment.RABBITMQ_HOST!,
    port,
    user: environment.RABBITMQ_USER!,
    password: environment.RABBITMQ_PASSWORD!,
    vhost: environment.RABBITMQ_VHOST!,
    exchange: environment.RABBITMQ_EXCHANGE ?? "workapool.domain.events",
    deadLetterExchange:
      environment.RABBITMQ_DEAD_LETTER_EXCHANGE ??
      "workapool.domain.events.dlx",
    ibcQueue:
      environment.RABBITMQ_IBC_QUEUE ?? "workapool.ibc.carga-fechada",
    ibcDeadLetterQueue:
      environment.RABBITMQ_IBC_DLQ ?? "workapool.ibc.dead-letter",
    maxConsumerRetries,
  };
}
