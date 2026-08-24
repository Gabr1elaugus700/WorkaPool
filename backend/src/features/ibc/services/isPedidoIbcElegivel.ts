import { PedidoCargo } from "../../pedidos/types/PedidoCargo.types";

/**
 * Pedido elegível para AlocacaoIbc / Fechar expedição:
 * container válido (251001) com quantidade esperada > 0 e sem ibcInvalido.
 */
export function isPedidoIbcElegivel(pedido: PedidoCargo): boolean {
  return (
    pedido.isContainer &&
    !pedido.ibcInvalido &&
    pedido.quantidadeEsperadaTotal > 0
  );
}
