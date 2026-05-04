import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

export class GetCargasFechadasUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
  ) {}

  async execute() {
    const cargasFechadas = await this.cargoRepository.getCargasFechadas();
    return cargasFechadas;
  }
}
