import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

export class NewNumberCargoUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
  ) {}
    async execute(): Promise<number> {
    const maxCodCar = await this.cargoRepository.getMaxCodCar();
    return maxCodCar + 1;
  }

}