import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class GetCargasFechadasUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute() {
    const cargasFechadas = await this.cargoRepository.getCargasFechadas();
    return cargasFechadas;
  }
}
