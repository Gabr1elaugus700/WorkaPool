import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";

export class UpdatePedidoCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}
  async execute(numPed: number, codCar: number, posCar: number) {
    
    if (numPed == null || codCar == null || posCar == null) {
      throw new AppError({
        message: "Dados obrigatórios ausentes para atualizar pedido na carga",
        statusCode: 400,
        code: "CARGO_PEDIDO_DATA_REQUIRED",
        details: { numPed, codCar, posCar },
      });
    }

    await this.cargoRepository.updatePedidoCarga(numPed, codCar, posCar);

    if (codCar > 0) {
      
      try { 
        const { peso } = await this.pedidosRepository.getPedidoWeight(numPed);
        console.log("⚖️ [UseCase] Peso do pedido obtido:", peso);

        const carga = await this.cargoRepository.getCargaByCodCar(codCar);
        if (!carga) {
          console.error("❌ [UseCase] Carga não encontrada:", codCar);
          throw new AppError({
            message: `Carga ${codCar} não encontrada`,
            statusCode: 404,
            code: "CARGO_NOT_FOUND",
            details: { codCar },
          });
        }

        // Salvar o histórico de peso
        await this.pedidosRepository.createHistoricoPeso(
          numPed,
          carga.id,
          peso
        );
      } catch (error) {
        console.error("❌ [UseCase] Erro ao salvar histórico de peso:", error);
        // Não falhar a operação se não conseguir salvar o histórico
        // A atualização do pedido já foi feita
      }
    }
  }
}
