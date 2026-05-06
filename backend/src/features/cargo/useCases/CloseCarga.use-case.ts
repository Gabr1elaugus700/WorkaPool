import { Carga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { PedidoService } from "../../pedidos/services/PedidoService";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";

export class CloseCargaUseCase {
    private readonly cargoRepository: ICargoRepository;
    private readonly pedidoService: PedidoService;

    constructor(
        cargoRepository?: ICargoRepository,
        pedidoService?: PedidoService,
    ) {
        this.cargoRepository = cargoRepository ?? this.createDefaultRepository();
        this.pedidoService = pedidoService ?? new PedidoService(new PedidosRepository());
    }

    
    private createDefaultRepository(): ICargoRepository {
        // Lazy-load para evitar side effects de conexão SQL em testes unitários.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { CargoRepository } = require("../repositories/CargoRepository");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PedidosRepository } = require("../../pedidos/repositories/PedidosRepository");
        return new CargoRepository(new PedidosRepository());
    }
    
    async execute(codCar: number): Promise<{ carga: Carga; pedidosSalvos: number, pedidosSemCargaSapiens: string[] }> {
        

        if (codCar == null) {
            throw new AppError({
                message: "Código da carga é obrigatório",
                statusCode: 400,
                code: "CARGO_COD_CAR_REQUIRED",
                details: { codCar },
            });
        }

        const carga = await this.cargoRepository.getCargaByCodCar(codCar);
        if (!carga) {
            throw new AppError({
                message: `Carga ${codCar} não encontrada`,
                statusCode: 404,
                code: "CARGO_NOT_FOUND",
                details: { codCar },
            });
        }

        const pedidos = await this.cargoRepository.getPedidosPorCarga(carga.codCar);
        if (pedidos.length === 0) {
            throw new AppError({
                message: `Carga ${codCar} não possui pedidos vinculados`,
                statusCode: 409,
                code: "CARGO_SEM_PEDIDOS_VINCULADOS",
                details: { codCar },
            });
        }

        const pedidosSemCarga: string[] = [];

        for (const pedido of pedidos) {
            
            const numPed = Number(pedido.numPed);

            if (!await this.cargoRepository.validarCargaSapiens(numPed)) {
                pedidosSemCarga.push(numPed.toString());
            }
           
        }
        if (pedidosSemCarga.length > 0) {
            throw new AppError({
                message: `Os seguintes pedidos não estão vinculados a nenhuma carga no sistema Sapiens: ${pedidosSemCarga.join(", ")}`,
                statusCode: 409,
                code: "CARGO_PEDIDOS_FORA_DO_SAPIENS",
                details: { codCar, pedidos: pedidosSemCarga },
            });
        } else {
            console.log(`Os seguintes pedidos estão corretamente em alguma carga no sistema Sapiens: ${pedidosSemCarga.join(", ")}`);
        }

        const pedidosSalvos = pedidos.length;
        const resultado = await this.cargoRepository.closeCarga(codCar);
        return {
            ...resultado,
            pedidosSalvos,
            pedidosSemCargaSapiens: pedidosSemCarga,
        };
    }
}
