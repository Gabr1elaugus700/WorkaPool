import { PedidoCargo } from '../types/PedidoCargo.types';
import { HistoricoPesoPedido } from '../entities/HistoricoPesoPedido';

/**
 * Contrato para operações relacionadas a pedidos.
 * Abstrai acesso ao ERP Sapiens e persistência de histórico.
 */
export interface IPedidosRepository {
  /**
   * Busca pedidos do Sapiens, opcionalmente filtrados por representante.
   * @param codRep - Código do representante (999 = todos)
   * @param codCar - Código da carga (opcional)
   */
  getPedidos(codRep?: number, codCar?: number): Promise<PedidoCargo[]>;

  /**
   * Busca pedidos vinculados a uma carga específica.
   * @param codCar - Código da carga
   */
  getPedidosByCarga(codCar: number): Promise<PedidoCargo[]>;

  /**
   * Obtém o peso atual de um pedido no Sapiens.
   * @param numPed - Número do pedido
   * @returns Objeto com número do pedido e peso
   */
  getPedidoWeight(numPed: number): Promise<{ numPed: number; peso: number }>;

  /**
   * Busca situação de um pedido no Sapiens.
   * @param numPed - Número do pedido
   * @returns Objeto com número e situação do pedido
   */
  getPedidoSituacaoSapiens(
    numPed: number,
  ): Promise<{ numPed: number; sitPed: number }>;

  /**
   * Cria registro de histórico de peso para um pedido em uma carga.
   * @param numPed - Número do pedido
   * @param cargaId - ID da carga
   * @param peso - Peso do pedido
   */
  createHistoricoPeso(
    numPed: number,
    cargaId: string,
    peso: number,
  ): Promise<void>;

  /**
   * Obtém o último histórico de peso registrado para um pedido.
   * @param numPed - Número do pedido
   * @returns Histórico mais recente ou null se não existir
   */
  getLastHistoricoPeso(numPed: number): Promise<HistoricoPesoPedido | null>;
}
