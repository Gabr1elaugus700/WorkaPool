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

      // Peso máximo total da carga
      const pesoMaximoCarga = carga.pesoMaximo;

      // Calcula o peso usado pelos pedidos baseado no histórico
      let pesoUsadoPedidos = 0;
      for (const pedido of pedidos) {
        const numPed = Number(pedido.numPed);
        const historico =
          await this.cargoRepository.getLastHistoricoPesoPedido(numPed);

        if (historico && historico.peso) {
          pesoUsadoPedidos += historico.peso;
        } else {
          // Se não houver histórico, usa o peso atual
          const pesoAtual = await this.cargoRepository
            .getPedidosWeight(numPed)
            .then((res) => res.peso);

          if (!isNaN(pesoAtual) && pesoAtual !== null) {
            pesoUsadoPedidos += pesoAtual;
          }
        }
      }

      const pesoDisponivel = pesoMaximoCarga - pesoUsadoPedidos;

      console.log(
        `📦 Carga ${carga.codCar} possui ${pedidos.length} pedido(s)\n` +
          `   Peso Máximo: ${pesoMaximoCarga}\n` +
          `   Peso Usado: ${pesoUsadoPedidos}\n` +
          `   Peso Disponível: ${pesoDisponivel}`,
      );

      for (const pedido of pedidos) {
        const numPed = Number(pedido.numPed);
        const pesoAtual = await this.cargoRepository
          .getPedidosWeight(numPed)
          .then((res) => res.peso);

        console.log(
          `🔍 Verificando pedido ${numPed} com peso atual: ${pesoAtual}`,
        );
        // Validar peso
        if (isNaN(pesoAtual) || pesoAtual === null || pesoAtual === undefined) {
          console.warn(
            `⚠️ Pedido ${numPed} com peso inválido: ${pedido.qtdOri}. Pulando...`,
          );
          continue;
        }

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
          console.log(`🚫 Removendo pedido ${numPed} da carga ${carga.codCar}`);

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
