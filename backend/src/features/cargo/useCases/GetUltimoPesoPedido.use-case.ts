import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class GetUltimoPesoPedidoUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute(numPed: number) {
    const historico = await this.cargoRepository.getLastHistoricoPesoPedido(numPed);

    if (!historico) {
      throw new Error(`Histórico do pedido ${numPed} não encontrado.`);
    }

    return historico;
  }
}
