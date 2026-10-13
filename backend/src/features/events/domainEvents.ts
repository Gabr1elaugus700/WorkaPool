import { z } from "zod";

const EVENT_TYPES = {
  CARGA_FECHADA: "CARGA_FECHADA",
  VIAGEM_IBC_FECHADA: "ViagemIbcFechada",
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

const ficouNaViagemSchema = z.object({
  ibcId: z.string().uuid(),
  identificador: z.string().min(1),
  modalidade: z.enum(["VENDA", "EMPRESTIMO"]),
  codCli: z.string().nullable(),
  cliente: z.string(),
  numPed: z.string().min(1),
});

const viagemIbcFechadaEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal(EVENT_TYPES.VIAGEM_IBC_FECHADA),
  occurredAt: z.string().datetime(),
  payload: z.object({
    expedicaoIbcId: z.string().uuid(),
    codCar: z.number().int().positive(),
    fechadaPorId: z.string().uuid(),
    fechadaEm: z.string().datetime(),
    ficaram: z.array(ficouNaViagemSchema),
  }),
});

export type CargoClosedEvent = z.infer<typeof cargoClosedEventSchema>;
export type ViagemIbcFechadaEvent = z.infer<typeof viagemIbcFechadaEventSchema>;
export type DomainEvent = CargoClosedEvent | ViagemIbcFechadaEvent;

const ROUTING_KEYS: Record<
  (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES],
  string
> = {
  [EVENT_TYPES.CARGA_FECHADA]: "carga.fechada",
  [EVENT_TYPES.VIAGEM_IBC_FECHADA]: "viagem.ibc.fechada",
};

function getRoutingKey(eventType: string): string {
  if (
    eventType === EVENT_TYPES.CARGA_FECHADA ||
    eventType === EVENT_TYPES.VIAGEM_IBC_FECHADA
  ) {
    return ROUTING_KEYS[eventType];
  }
  throw new Error(`Tipo de evento sem routing key: ${eventType}`);
}

export const domainEvents = {
  EVENT_TYPES,
  cargoClosedEventSchema,
  viagemIbcFechadaEventSchema,
  getRoutingKey,
};
