import { Carga } from "../entities/Carga";
import { CargoRepository } from "../repositories/CargoRepository";
import { ICargoRepository } from "../repositories/ICargoRepository";

export class CloseCargaUseCase {
    constructor(
        private readonly cargoRepository: ICargoRepository = new CargoRepository(),
    ) {}

    async execute(codCar: number): Promise<{ carga: Carga; pedidosSalvos: number }> {
        if (codCar == null) {
            throw new Error("Código da carga é obrigatório");
        }

        const resultado = await this.cargoRepository.closeCarga(codCar);
        return resultado;
    }
}
