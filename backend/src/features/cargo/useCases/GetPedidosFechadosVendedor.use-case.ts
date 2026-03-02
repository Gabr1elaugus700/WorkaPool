import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class GetPedidosFechadosVendedorUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute(codRep: number) {
    if (codRep == null) {
      throw new Error("Código do vendedor é obrigatório");
    }

    const pedidos =
      await this.cargoRepository.getPedidosFechadosPorVendedor(codRep);
    return pedidos;
  }
}
