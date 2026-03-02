import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class GetCargaByIdUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}
  async execute(codCar: number) {
    if (codCar == null) {
      throw new Error("Código da carga é obrigatório");
    }
    const carga = await this.cargoRepository.getCargaById(codCar.toString());
    if (!carga) {
      throw new Error("Carga não encontrada");
    }
    return carga;
  }
}
