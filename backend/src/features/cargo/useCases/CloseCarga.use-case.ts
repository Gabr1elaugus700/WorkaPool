import { Carga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { PedidoService } from "../../pedidos/services/PedidoService";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

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
            throw new Error("Código da carga é obrigatório");
        }

        const carga = await this.cargoRepository.getCargaByCodCar(codCar);
        if (!carga) {
            throw new Error(`Carga com código ${codCar} não encontrada`);
        }

        const pedidos = await this.cargoRepository.getPedidosPorCarga(carga.codCar);
        if (pedidos.length === 0) {
            throw new Error(`Carga ${codCar} não possui pedidos vinculados`);
        }

        const pedidosSemCarga: string[] = [];

        for (const pedido of pedidos) {
            
            const numPed = Number(pedido.numPed);

            if (!await this.cargoRepository.validarCargaSapiens(numPed)) {
                pedidosSemCarga.push(numPed.toString());
            }
           
        }
        if (pedidosSemCarga.length > 0) {
            throw new Error(`Os seguintes pedidos não estão vinculados a nenhuma carga no sistema Sapiens: ${pedidosSemCarga.join(", ")}`);
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
