import type { Response } from "express";
import type { CargoClosedEvent } from "../../events/domainEvents";

export type IbcSseGateway = {
  addClient(response: Response): () => void;
  broadcast(event: CargoClosedEvent): void;
};

class InMemoryIbcSseGateway implements IbcSseGateway {
  private readonly clients = new Set<Response>();

  addClient(response: Response): () => void {
    this.clients.add(response);
    return () => {
      this.clients.delete(response);
    };
  }

  broadcast(event: CargoClosedEvent): void {
    const notification = JSON.stringify({
      event: event.eventType,
      cargaId: event.payload.cargaId,
      codCar: event.payload.codCar,
    });
    const message = `event: ${event.eventType}\ndata: ${notification}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(message);
      } catch {
        this.clients.delete(client);
      }
    }
  }
}

export const ibcSseGateway: IbcSseGateway = new InMemoryIbcSseGateway();
