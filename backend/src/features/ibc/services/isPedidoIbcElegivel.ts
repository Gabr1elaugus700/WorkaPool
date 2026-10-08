/**
 * Campos usados para decidir elegibilidade. `isContainer` vem do Pedido do Sapiens;
 * a foto `CargaPedidoIbc` não tem o campo porque só grava Pedidos com sinal 251001.
 */
export type PedidoIbcElegibilidade = {
  ibcInvalido: boolean;
  quantidadeEsperadaTotal: number;
  isContainer?: boolean;
};

/**
 * Pedido elegível para AlocacaoIbc / Fechar expedição:
 * container válido (251001) com quantidade esperada > 0 e sem ibcInvalido.
 */
export function isPedidoIbcElegivel(pedido: PedidoIbcElegibilidade): boolean {
  return (
    pedido.isContainer !== false &&
    !pedido.ibcInvalido &&
    pedido.quantidadeEsperadaTotal > 0
  );
}
