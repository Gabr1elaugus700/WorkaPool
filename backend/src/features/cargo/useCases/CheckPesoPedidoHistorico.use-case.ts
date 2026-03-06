import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { GetCargasBySituacaoUseCase } from "./GetCargaBySituacao.use-case";
import { SituacaoCarga } from "../entities/Carga";

export class CheckPesoPedidoHistoricoUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute() {
    const openCargas = await new GetCargasBySituacaoUseCase().execute(
      SituacaoCarga.ABERTA,
    );

    console.log(`🔍 Verificando ${openCargas.length} carga(s) aberta(s)...`);

    for (const carga of openCargas) {
      const pedidos = await this.cargoRepository.getPedidosPorCarga(
        carga.codCar,
      );

      console.log(`📦 Carga ${carga.codCar} possui ${pedidos.length} pedido(s)`);

      for (const pedido of pedidos) {
        const numPed = Number(pedido.numPed);
        const pesoAtual = Number(pedido.qtdOri);
        const lastPeso =
          await this.cargoRepository.getLastHistoricoPesoPedido(numPed);


        if (!lastPeso) {
          console.log(
            `📝 Pedido ${numPed} sem histórico. Criando registro inicial com peso: ${pesoAtual}`,
          );
          await this.cargoRepository.createHistoricoPesoPedido(
            numPed,
            carga.id,
            pesoAtual,
          );
          continue;
        }

        if (lastPeso.peso === pesoAtual) {
          console.log(`✅ Pedido ${numPed} manteve o peso: ${pesoAtual}`);
          continue;
        }

        if (lastPeso.peso < pesoAtual) {
          console.log(
            `🔺 Pedido ${numPed}: peso aumentou ${lastPeso.peso} → ${pesoAtual}`,
          );
          console.log(
            `🚫 Removendo pedido ${numPed} da carga ${carga.codCar}`,
          );
          
          await this.cargoRepository.updatePedidoCarga(numPed, 0, 0);
          await this.cargoRepository.createHistoricoPesoPedido(
            numPed,
            carga.id,
            pesoAtual,
          );
          
          console.log(`✅ Histórico atualizado para pedido ${numPed}`);
          continue; 
        }

        if (lastPeso.peso > pesoAtual) {
          console.log(
            `🔻 Pedido ${numPed}: peso reduziu ${lastPeso.peso} → ${pesoAtual}`,
          );
          
          await this.cargoRepository.createHistoricoPesoPedido(
            numPed,
            carga.id,
            pesoAtual,
          );
          
          console.log(`✅ Histórico atualizado para pedido ${numPed}`);
        }
      }
    }

    console.log(`✅ Verificação concluída para ${openCargas.length} carga(s)`);
    return openCargas;
  }
}