import { SituacaoCarga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class GetCargasBySituacaoUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute(situacao: SituacaoCarga) {
    return this.cargoRepository.getCargas(situacao);
  }
}