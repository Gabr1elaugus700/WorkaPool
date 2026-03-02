import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class UpdatePedidoCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}
  async execute(numPed: number, codCar: number, posCar: number) {
    if (numPed == null || codCar == null || posCar == null) {
      throw new Error("Dados obrigatórios ausentes");
    }

    await this.cargoRepository.updatePedidoCarga(codCar, posCar, numPed);
  }
}
