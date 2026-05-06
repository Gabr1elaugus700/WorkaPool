import { Carga, SituacaoCarga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";

export class UpdateCargaSituacaoUseCase {
    constructor(
        private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
    ) {}
    
    async execute(codCar: number, situacao: SituacaoCarga): Promise<Carga> {
        if (codCar == null || situacao == null) {
            throw new AppError({
                message: "Código da carga e situação são obrigatórios",
                statusCode: 400,
                code: "CARGO_UPDATE_SITUACAO_DATA_REQUIRED",
                details: { codCar, situacao },
            });
        }

            
        const cargaAtualizada = await this.cargoRepository.updateSituacaoCarga(codCar, situacao);
        return cargaAtualizada;
    } 
}