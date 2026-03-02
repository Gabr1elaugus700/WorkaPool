import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class NewNumberCargoUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}
    async execute(): Promise<number> {
    const maxCodCar = await this.cargoRepository.getMaxCodCar();
    return maxCodCar + 1;
  }

}