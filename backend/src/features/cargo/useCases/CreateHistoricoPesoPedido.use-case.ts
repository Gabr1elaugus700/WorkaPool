import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class CreateHistoricoPesoPedidoUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute(numPed: number, cargaId: string, peso: number) {
    const input = await this.cargoRepository.getLastHistoricoPesoPedido(numPed);

    if (!input) {
      throw new Error(`Histórico do pedido ${numPed} não encontrado.`);
    }

    await this.cargoRepository.createHistoricoPesoPedido(numPed, cargaId, peso);
  }
}
