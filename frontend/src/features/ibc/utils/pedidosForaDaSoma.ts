import type { PedidoIbcPreparacaoDTO } from "../types/ibcExpedicao.types";

export type PedidosForaDaSoma = {
  mistos: PedidoIbcPreparacaoDTO[];
  invalidos: PedidoIbcPreparacaoDTO[];
};

function isPedidoMisto(pedido: PedidoIbcPreparacaoDTO): boolean {
  return pedido.quantidadeEsperadaVenda > 0 && pedido.quantidadeEsperadaEmprestimo > 0;
}

/**
 * Pedido misto e pedido IBC inválido não entram na soma da carga.
 * O restante da foto continua elegível.
 */
export function separarPedidosForaDaSoma(
  pedidos: readonly PedidoIbcPreparacaoDTO[],
): PedidosForaDaSoma {
  const mistos: PedidoIbcPreparacaoDTO[] = [];
  const invalidos: PedidoIbcPreparacaoDTO[] = [];
  for (const pedido of pedidos) {
    if (pedido.ibcInvalido) {
      invalidos.push(pedido);
      continue;
    }
    if (isPedidoMisto(pedido)) mistos.push(pedido);
  }
  return { mistos, invalidos };
}
