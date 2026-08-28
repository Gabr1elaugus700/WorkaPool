import type { DomainEvent } from "./domainEvents";

export type EventHandler = (event: unknown) => Promise<void>;

export interface EventBroker {
  publish(event: DomainEvent, routingKey: string): Promise<void>;
  consume(queue: string, handler: EventHandler): Promise<void>;
  close(): Promise<void>;
}
