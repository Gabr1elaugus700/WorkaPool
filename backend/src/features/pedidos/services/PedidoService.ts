import { HistoricoPesoPedido } from '../entities/HistoricoPesoPedido';
import { IPedidosRepository } from '../repositories/IPedidosRepository';
import { AppError } from '../../../utils/AppError';

/**
 * Mínimo necessário para peso / histórico por número de pedido.
 * Elegibilidade IBC vive em PedidoCargo via mapper — não acoplar este serviço a PedidoCargo.
 */
type PedidoComNumero = {
  numPed: string;
};

/**
 * Serviço para operações relacionadas a pedidos individuais.
 * Responsável por buscar e validar dados de UM pedido específico.
 */
export class PedidoService {
  constructor(private readonly pedidosRepository: IPedidosRepository) {}

  /**
   * Obtém o peso ATUAL cadastrado no sistema para o pedido.
   * @param pedido O pedido para consultar
   * @returns O peso atual cadastrado
   * @throws AppError se o peso for inválido
   */
  async pesoAtualPedido(pedido: PedidoComNumero): Promise<number> {
    const numPed = Number(pedido.numPed);
    const pesoAtual = await this.pedidosRepository
      .getPedidoWeight(numPed)
      .then((res) => res.peso);

    if (isNaN(pesoAtual) || pesoAtual == null) {
      throw new AppError({
        message: `Pedido ${numPed} possui peso inválido`,
        statusCode: 422,
        code: 'PEDIDOS_INVALID_WEIGHT',
        details: { numPed, pesoAtual },
      });
    }

    return pesoAtual;
  }

  /**
   * Obtém o último histórico de peso do pedido.
   * @param pedido O pedido para consultar
   * @returns O histórico mais recente ou null se não existir
   */
  async getUltimoHistoricoPeso(
    pedido: PedidoComNumero,
  ): Promise<HistoricoPesoPedido | null> {
    const numPed = Number(pedido.numPed);
    const historico =
      await this.pedidosRepository.getLastHistoricoPeso(numPed);
    return historico;
  }

  /**
   * Verifica se o pedido teve alteração de peso comparando com o histórico.
   * @param pedido O pedido para verificar
   * @returns Objeto com informações sobre a mudança de peso
   */
  async verificarMudancaPeso(pedido: PedidoComNumero): Promise<{
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
      mudou: diferenca !== 0,
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
    pedido: PedidoComNumero,
    cargaId: string,
    peso: number,
  ): Promise<void> {
    const numPed = Number(pedido.numPed);
    const ultimoHistorico =
      await this.pedidosRepository.getLastHistoricoPeso(numPed);

    if (ultimoHistorico && ultimoHistorico.peso === peso) {
      return;
    }

    await this.pedidosRepository.createHistoricoPeso(numPed, cargaId, peso);
  }

  /**
   * Retorna a situação do pedido no sistema Sapiens, para verificar se o pedido foi vinculado a uma carga ou não.
   * @param numPed O número do pedido
   * @returns Um objeto contendo o número do pedido e sua situação
   */
  async getPedidoCargaSapiens(
    numPed: number,
  ): Promise<{ numPed: number; sitPed: number }> {
    return await this.pedidosRepository.getPedidoSituacaoSapiens(numPed);
  }
}
