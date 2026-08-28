import { domainEvents } from "../../events/domainEvents";
import type { EventBroker } from "../../events/eventBroker";
import { RabbitMqEventBroker } from "../../events/rabbitMqEventBroker";
import {
  ProcessedEventRepository,
} from "../repositories/ProcessedEventRepository";
import { ibcSseGateway } from "./ibcSseGateway";
import type { IbcSseGateway } from "./ibcSseGateway";

export type ProcessedEventStore = Pick<
  ProcessedEventRepository,
  "tryMarkProcessed"
>;

export class IbcEventConsumer {
  private readonly broker: EventBroker;
  private readonly processedEvents: ProcessedEventStore;
  private readonly gateway: IbcSseGateway;
  private readonly queue: string;

  constructor(
    broker?: EventBroker,
    processedEvents?: ProcessedEventStore,
    gateway: IbcSseGateway = ibcSseGateway,
    queue = process.env.RABBITMQ_IBC_QUEUE ?? "workapool.ibc.carga-fechada",
  ) {
    this.broker = broker ?? new RabbitMqEventBroker();
    this.processedEvents =
      processedEvents ?? new ProcessedEventRepository();
    this.gateway = gateway;
    this.queue = queue;
  }

  async start(): Promise<void> {
    await this.broker.consume(this.queue, async (raw) => {
      const event = domainEvents.cargoClosedEventSchema.parse(raw);
      if (event.eventType !== domainEvents.EVENT_TYPES.CARGA_FECHADA) return;

      const shouldProcess = await this.processedEvents.tryMarkProcessed(
        "IBC_SSE",
        event.eventId,
      );
      if (!shouldProcess) return;

      this.gateway.broadcast(event);
    });
    console.log("IBC event consumer conectado à fila CARGA_FECHADA");
  }

  async stop(): Promise<void> {
    await this.broker.close();
  }
}
