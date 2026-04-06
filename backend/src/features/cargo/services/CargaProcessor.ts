import { ICargoRepository } from "../repositories/ICargoRepository";
import { Carga } from "../entities/Carga";
import { Pedido } from "../entities/Pedido";
import { PesoCargaCalculator } from "./PesoCargaCalculator";
import { PedidoService } from "../../pedidos/services/PedidoService";

/**
 * Orquestrador de operações complexas sobre cargas.
 * Combina PedidoService e PesoCargaCalculator para executar regras de negócio.
 */
export class CargaProcessor {
  constructor(
    private readonly cargoRepository: ICargoRepository,
    private readonly pesoCargaCalculator: PesoCargaCalculator,
    private readonly pedidoService: PedidoService,
  ) {}

  /**
   * Processa mudanças de peso em pedidos de uma carga.
   * Remove pedidos que não cabem mais, reposiciona os que aumentaram.
   */
  async processarMudancasPesoPedidos(carga: Carga): Promise<{
    pedidosRemovidos: number[];
    pedidosReposicionados: number[];
    pedidosSemHistorico: number[];
  }> {
    const pedidos = await this.cargoRepository.getPedidosPorCarga(carga.codCar);
    
    const pedidosRemovidos: number[] = [];
    const pedidosReposicionados: number[] = [];
    const pedidosSemHistorico: number[] = [];

    for (const pedido of pedidos) {
      try {
        const mudanca = await this.pedidoService.verificarMudancaPeso(pedido);

        // Sem histórico: cria inicial
        if (mudanca.pesoAnterior === null) {
          console.log(
            `📝 Pedido ${pedido.numPed} sem histórico. Criando registro inicial com peso: ${mudanca.pesoAtual}`,
          );
          await this.pedidoService.salvarHistoricoPeso(
            pedido,
            carga.id,
            mudanca.pesoAtual,
          );
          pedidosSemHistorico.push(Number(pedido.numPed));
          continue;
        }

        // Sem mudança: pula
        if (!mudanca.mudou) {
          console.log(`✅ Pedido ${pedido.numPed} manteve o peso: ${mudanca.pesoAtual}`);
          continue;
        }

        // Peso aumentou: verifica se ainda cabe
        if (mudanca.aumentou) {
          console.log(
            `🔺 Pedido ${pedido.numPed}: peso aumentou ${mudanca.pesoAnterior} → ${mudanca.pesoAtual}`,
          );

          const simulacao = await this.pesoCargaCalculator.simularNovoPeso(
            carga,
            pedidos,
            pedido,
          );

          if (!simulacao.cabeNaCarga) {
            console.log(
              `🚫 Removendo pedido ${pedido.numPed} da carga ${carga.codCar}\n` +
                `   Excede em: ${simulacao.excesso}kg`,
            );
            await this.removerPedidoDaCarga(pedido);
            pedidosRemovidos.push(Number(pedido.numPed));
          } else {
            console.log(
              `✅ Pedido ${pedido.numPed} ainda cabe na carga\n` +
                `   🔄 Movendo para última posição da carga...`,
            );
            await this.moverPedidoParaFinal(carga, pedido);
            pedidosReposicionados.push(Number(pedido.numPed));
          }

          await this.pedidoService.salvarHistoricoPeso(
            pedido,
            carga.id,
            mudanca.pesoAtual,
          );
        }

        // Peso reduziu: só atualiza histórico
        if (mudanca.reducao) {
          console.log(
            `🔻 Pedido ${pedido.numPed}: peso reduziu ${mudanca.pesoAnterior} → ${mudanca.pesoAtual}`,
          );
          await this.pedidoService.salvarHistoricoPeso(
            pedido,
            carga.id,
            mudanca.pesoAtual,
          );
        }
      } catch (error) {
        console.error(`❌ Erro ao processar pedido ${pedido.numPed}:`, error);
      }
    }

    return {
      pedidosRemovidos,
      pedidosReposicionados,
      pedidosSemHistorico,
    };
  }

  /**
   * Remove um pedido da carga.
   */
  private async removerPedidoDaCarga(pedido: Pedido): Promise<void> {
    await this.cargoRepository.updatePedidoCarga(Number(pedido.numPed), 0, 0);
  }

  /**
   * Move um pedido para a última posição da carga.
   */
  private async moverPedidoParaFinal(carga: Carga, pedido: Pedido): Promise<void> {
    const pedidosList = await this.cargoRepository.getPedidosPorCarga(carga.codCar);
    const maxPosCar = Math.max(...pedidosList.map((p) => p.poscar || 0), 0);
    const novaPosCar = maxPosCar + 1;

    await this.cargoRepository.updatePedidoCarga(
      Number(pedido.numPed),
      carga.codCar,
      novaPosCar,
    );

    console.log(`✅ Pedido reposicionado para posição: ${novaPosCar}`);
  }

  /**
   * Adiciona um pedido à carga se houver espaço.
   */
  async adicionarPedidoNaCarga(
    carga: Carga,
    pedido: Pedido,
  ): Promise<{ adicionado: boolean; motivo?: string }> {
    const validacao = await this.pesoCargaCalculator.validarAdicaoPedido(carga, pedido);

    if (!validacao.podeAdicionar) {
      return {
        adicionado: false,
        motivo: `Pedido excede capacidade em ${validacao.excesso}kg`,
      };
    }

    await this.moverPedidoParaFinal(carga, pedido);
    await this.pedidoService.salvarHistoricoPeso(
      pedido,
      carga.id,
      validacao.pesoPedido,
    );

    return { adicionado: true };
  }
}