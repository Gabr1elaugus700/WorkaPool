import { domainEvents } from "../../events/domainEvents";
import type { EventBroker } from "../../events/eventBroker";
import { RabbitMqEventBroker } from "../../events/rabbitMqEventBroker";
import {
  GerarAvisosRepresentanteUseCase,
  type GerarAvisosRepresentanteInput,
} from "../useCases/GerarAvisosRepresentante.use-case";

type GerarAvisos = {
  execute(input: GerarAvisosRepresentanteInput): Promise<unknown>;
};

export class AvisoRepresentanteConsumer {
  private readonly broker: EventBroker;
  private readonly gerarAvisos: GerarAvisos;
  private readonly queue: string;

  constructor(
    broker?: EventBroker,
    gerarAvisos?: GerarAvisos,
    queue = process.env.RABBITMQ_IBC_AVISO_QUEUE ?? "workapool.ibc.viagem-fechada",
  ) {
    this.broker = broker ?? new RabbitMqEventBroker();
    this.gerarAvisos = gerarAvisos ?? new GerarAvisosRepresentanteUseCase();
    this.queue = queue;
  }

  async start(): Promise<void> {
    const routingKey = domainEvents.getRoutingKey(
      domainEvents.EVENT_TYPES.VIAGEM_IBC_FECHADA,
    );
    await this.broker.consume(
      this.queue,
      async (raw) => {
        const event = domainEvents.viagemIbcFechadaEventSchema.parse(raw);
        await this.gerarAvisos.execute({
          eventId: event.eventId,
          expedicaoIbcId: event.payload.expedicaoIbcId,
          codCar: event.payload.codCar,
          ficaram: event.payload.ficaram,
        });
      },
      routingKey,
    );
    console.log("Consumer de aviso ao representante conectado à fila viagem.ibc.fechada");
  }

  async stop(): Promise<void> {
    await this.broker.close();
  }
}
