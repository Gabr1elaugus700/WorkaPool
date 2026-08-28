import {
  domainEvents,
} from "./domainEvents";
import type { DomainEvent } from "./domainEvents";
import type { EventBroker } from "./eventBroker";
import { OutboxRepository } from "./outboxRepository";
import type { OutboxEventRecord } from "./outboxRepository";

export type OutboxStore = Pick<
  OutboxRepository,
  "claimNext" | "markPublished" | "markFailed"
>;

export class OutboxPublisher {
  private running = false;

  constructor(
    private readonly outbox: OutboxStore,
    private readonly broker: EventBroker,
    private readonly pollIntervalMs = 1000,
  ) {}

  async publishOnce(): Promise<boolean> {
    const event = await this.outbox.claimNext();
    if (!event) return false;

    try {
      const domainEvent = this.toDomainEvent(event);
      await this.broker.publish(
        domainEvent,
        domainEvents.getRoutingKey(event.eventType),
      );
      await this.outbox.markPublished(event.id);
      return true;
    } catch (error: unknown) {
      await this.outbox.markFailed(event.id, error);
      return false;
    }
  }

  async start(): Promise<void> {
    this.running = true;
    while (this.running) {
      const published = await this.publishOnce();
      if (!published) {
        await this.sleep(this.pollIntervalMs);
      }
    }
  }

  stop(): void {
    this.running = false;
  }

  private toDomainEvent(event: OutboxEventRecord): DomainEvent {
    if (event.eventType !== domainEvents.EVENT_TYPES.CARGA_FECHADA) {
      throw new Error(`Tipo de evento não suportado: ${event.eventType}`);
    }

    return domainEvents.cargoClosedEventSchema.parse({
      eventId: event.id,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      payload: event.payload,
    });
  }

  private async sleep(durationMs: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, durationMs);
    });
  }
}
