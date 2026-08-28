import { z } from "zod";

const EVENT_TYPES = {
  CARGA_FECHADA: "CARGA_FECHADA",
} as const;

const cargoClosedEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(EVENT_TYPES.CARGA_FECHADA),
  occurredAt: z.string().datetime(),
  payload: z.object({
    cargaId: z.string().uuid(),
    codCar: z.number().int().positive(),
  }),
});

export type CargoClosedEvent = z.infer<typeof cargoClosedEventSchema>;
export type DomainEvent = CargoClosedEvent;

function getRoutingKey(eventType: string): string {
  if (eventType === EVENT_TYPES.CARGA_FECHADA) {
    return "carga.fechada";
  }
  throw new Error(`Tipo de evento sem routing key: ${eventType}`);
}

export const domainEvents = {
  EVENT_TYPES,
  cargoClosedEventSchema,
  getRoutingKey,
};
