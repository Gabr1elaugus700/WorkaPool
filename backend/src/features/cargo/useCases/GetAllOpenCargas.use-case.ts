import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { toCargaComPesoDTO } from "../http/schemas/cargoSchema";

export class GetAllOpenCargasUseCase {
    constructor(
        private readonly cargoRepository: ICargoRepository = new CargoRepository(),
    ) {}

    async execute() {
        const cargas = await this.cargoRepository.listarAbertas();
        
        // Para cada carga, buscar pedidos e calcular peso total
        const cargasComPeso = await Promise.all(
            cargas.map(async (carga) => {
                const pedidos = await this.cargoRepository.getPedidosPorCarga(carga.codCar);
                return toCargaComPesoDTO(carga, pedidos);
            })
        );
        
        return cargasComPeso;
    }
}