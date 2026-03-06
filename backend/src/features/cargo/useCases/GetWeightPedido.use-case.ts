import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { GetCargasBySituacaoUseCase } from "./GetCargaBySituacao.use-case";
import { SituacaoCarga } from "../entities/Carga";

export class GetWeightPedidoUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute(numPed: number) {
    const weightPedido = await this.cargoRepository.getPedidosWeight(numPed);

    if (!weightPedido) {
      throw new Error(`Peso do pedido ${numPed} não encontrado.`);
    }

    return weightPedido;
  }
}