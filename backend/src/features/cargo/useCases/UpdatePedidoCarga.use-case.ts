import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";

export class UpdatePedidoCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}
  async execute(numPed: number, codCar: number, posCar: number) {
    console.log("🟢 [UseCase] execute recebeu:", { numPed, codCar, posCar });
    
    if (numPed == null || codCar == null || posCar == null) {
      console.log("❌ [UseCase] Dados obrigatórios ausentes");
      throw new Error("Dados obrigatórios ausentes");
    }

    console.log("🟢 [UseCase] Chamando repository.updatePedidoCarga...");
    await this.cargoRepository.updatePedidoCarga(numPed, codCar, posCar);
    console.log("✅ [UseCase] Repository executado com sucesso");


    if (codCar > 0) {
      console.log("💾 [UseCase] Salvando histórico de peso do pedido...");
      
      try { 
        const { peso } = await this.cargoRepository.getPedidosWeight(numPed);
        console.log("⚖️ [UseCase] Peso do pedido obtido:", peso);

        const carga = await this.cargoRepository.getCargaByCodCar(codCar);
        if (!carga) {
          console.error("❌ [UseCase] Carga não encontrada:", codCar);
          throw new Error(`Carga ${codCar} não encontrada`);
        }

        // Salvar o histórico de peso
        await this.cargoRepository.createHistoricoPesoPedido(
          numPed,
          carga.id,
          peso
        );
        console.log("✅ [UseCase] Histórico de peso salvo com sucesso");
      } catch (error) {
        console.error("❌ [UseCase] Erro ao salvar histórico de peso:", error);
        // Não falhar a operação se não conseguir salvar o histórico
        // A atualização do pedido já foi feita
      }
    }
  }
}
