import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class GetAllOpenCargasUseCase {
    constructor(
        private readonly cargoRepository: ICargoRepository = new CargoRepository(),
    ) {}

    async execute() {
        const cargas = await this.cargoRepository.listarAbertas();
        return cargas;
    }
}