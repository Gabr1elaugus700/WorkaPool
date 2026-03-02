import { Carga, SituacaoCarga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class UpdateCargaSituacaoUseCase {
    constructor(
        private readonly cargoRepository: ICargoRepository = new CargoRepository(),
    ) {}

    async execute(codCar: number, situacao: SituacaoCarga): Promise<Carga> {
        if (codCar == null || situacao == null) {
            throw new Error("Código da carga e situação são obrigatórios");
        }

        const cargaAtualizada = await this.cargoRepository.updateSituacaoCarga(codCar, situacao);
        return cargaAtualizada;
    } 
}