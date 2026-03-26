import { Carga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { PedidoProcessor } from "../services/PedidoProcessor";

export class CloseCargaUseCase {
    private readonly cargoRepository: ICargoRepository;
    private readonly pedidoProcessor: PedidoProcessor;

    constructor(
        cargoRepository?: ICargoRepository,
        pedidoProcessor?: PedidoProcessor,
    ) {
        this.cargoRepository = cargoRepository ?? this.createDefaultRepository();
        this.pedidoProcessor = pedidoProcessor ?? new PedidoProcessor(this.cargoRepository);
    }

    private createDefaultRepository(): ICargoRepository {
        // Lazy-load para evitar side effects de conexão SQL em testes unitários.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { CargoRepository } = require("../repositories/CargoRepository");
        return new CargoRepository();
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
            const pedidoSituacao = await this.pedidoProcessor.getPedidoCargaSapiens(numPed);

            if (pedidoSituacao.sitPed !== 8) {
                pedidosSemCarga.push(pedido.numPed);
            }            
        }

        if (pedidosSemCarga.length > 0) {
            const numPeds = pedidosSemCarga.join(", ");
            throw new Error(`Os seguintes pedidos não estão vinculados a nenhuma carga no sistema Sapiens: ${numPeds}`);
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
