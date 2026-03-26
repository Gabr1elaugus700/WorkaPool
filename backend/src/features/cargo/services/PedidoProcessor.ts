import { Pedido, HistoricoPesoPedido } from "../entities/Pedido";
import { ICargoRepository } from "../repositories/ICargoRepository";

/**
 * Processa operações relacionadas a pedidos individuais.
 * Responsável por buscar e validar dados de UM pedido específico.
 */
export class PedidoProcessor {
  constructor(
    private readonly cargoRepository: ICargoRepository,
  ) {}

  /**
   * Obtém o peso ATUAL cadastrado no sistema para o pedido.
   * @param pedido O pedido para consultar
   * @returns O peso atual cadastrado
   * @throws Error se o peso for inválido
   */
  async pesoAtualPedido(pedido: Pedido): Promise<number> {
    const numPed = Number(pedido.numPed);
    const pesoAtual = await this.cargoRepository
      .getPedidosWeight(numPed)
      .then((res) => res.peso);

    if (isNaN(pesoAtual) || pesoAtual == null) {
      throw new Error(`Pedido ${numPed} possui peso inválido: ${pesoAtual}`);
    }

    return pesoAtual;
  }

  /**
   * Obtém o último histórico de peso do pedido.
   * @param pedido O pedido para consultar
   * @returns O histórico mais recente ou null se não existir
   */
  async getUltimoHistoricoPeso(pedido: Pedido): Promise<HistoricoPesoPedido | null> {
    const numPed = Number(pedido.numPed);
    const historico = await this.cargoRepository.getLastHistoricoPesoPedido(numPed);
    return historico as HistoricoPesoPedido | null;
  }

  /**
   * Verifica se o pedido teve alteração de peso comparando com o histórico.
   * @param pedido O pedido para verificar
   * @returns Objeto com informações sobre a mudança de peso
   */
  async verificarMudancaPeso(pedido: Pedido): Promise<{
    mudou: boolean;
    pesoAnterior: number | null;
    pesoAtual: number;
    aumentou: boolean;
    reducao: boolean;
    diferenca: number;
  }> {
    const pesoAtual = await this.pesoAtualPedido(pedido);
    const historico = await this.getUltimoHistoricoPeso(pedido);
    
    if (!historico) {
      return {
        mudou: false,
        pesoAnterior: null,
        pesoAtual,
        aumentou: false,
        reducao: false,
        diferenca: 0,
      };
    }

    const pesoAnterior = historico.peso;
    const diferenca = pesoAtual - pesoAnterior;

    return {
      mudou: pesoAnterior !== pesoAtual,
      pesoAnterior,
      pesoAtual,
      aumentou: diferenca > 0,
      reducao: diferenca < 0,
      diferenca,
    };
  }

  /**
   * Salva um novo registro de histórico de peso para o pedido.
   */
  async salvarHistoricoPeso(
    pedido: Pedido,
    cargaId: string,
    peso: number,
  ): Promise<void> {
    const numPed = Number(pedido.numPed);
    await this.cargoRepository.createHistoricoPesoPedido(numPed, cargaId, peso);
  }

  /**
   * Retorna a situação do pedido no sistema Sapiens, para verificar se o pedido foi vinculado a uma carga ou não.
   * @param numPed O número do pedido
   * @returns Um objeto contendo o número do pedido e sua situação
   */
  async getPedidoCargaSapiens(numPed: number): Promise<{ numPed: number; sitPed: number }> {
    return await this.cargoRepository.getPedidoCargaSapiens(numPed);
  }
}
