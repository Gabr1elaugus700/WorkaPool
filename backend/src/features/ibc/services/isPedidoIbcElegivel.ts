/**
 * Campos da foto `CargaPedidoIbc` usados para decidir elegibilidade. A foto só grava
 * Pedidos com sinal 251001, então não há `isContainer`.
 */
export type PedidoIbcElegibilidade = {
  ibcInvalido: boolean;
  quantidadeEsperadaTotal: number;
};

/**
 * Pedido elegível para AlocacaoIbc / Fechar expedição:
 * quantidade esperada > 0 e sem ibcInvalido.
 */
export function isPedidoIbcElegivel(pedido: PedidoIbcElegibilidade): boolean {
  return !pedido.ibcInvalido && pedido.quantidadeEsperadaTotal > 0;
}
