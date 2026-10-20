import {
  isPedidoIbcElegivel,
  PedidoIbcElegibilidade,
} from "./isPedidoIbcElegivel";

export type PedidoSomaCarga = PedidoIbcElegibilidade & {
  quantidadeEsperadaVenda: number;
  quantidadeEsperadaEmprestimo: number;
};

/**
 * Pedido misto (cota de incluso e cota de empréstimo) fica fora da soma.
 * Os outros pedidos da carga continuam.
 */
export function pedidosNaSomaDaCarga<T extends PedidoSomaCarga>(
  pedidos: readonly T[],
): T[] {
  return pedidos.filter(
    (pedido) =>
      isPedidoIbcElegivel(pedido) &&
      !(
        pedido.quantidadeEsperadaVenda > 0 &&
        pedido.quantidadeEsperadaEmprestimo > 0
      ),
  );
}
