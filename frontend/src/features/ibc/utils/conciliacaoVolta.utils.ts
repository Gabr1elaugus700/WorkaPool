import type { ConciliacaoViagemItemDTO, PedidoConciliacaoDTO } from "../types/conciliacaoViagem.types";

function apontaPedido(item: ConciliacaoViagemItemDTO): boolean {
  return (item.destino === "FICOU" || item.destino === "TROCA") && item.numPed != null;
}

function barras(
  pedidos: readonly PedidoConciliacaoDTO[],
  itens: readonly ConciliacaoViagemItemDTO[],
): PedidoConciliacaoDTO[] {
  return pedidos.map((pedido) => ({
    ...pedido,
    quantidadeApontada: itens.filter((item) => apontaPedido(item) && item.numPed === pedido.numPed).length,
  }));
}

function divergentes(pedidos: readonly PedidoConciliacaoDTO[]): PedidoConciliacaoDTO[] {
  return pedidos.filter((pedido) => pedido.quantidadeApontada !== pedido.quantidadeEsperada);
}

function confirmacoes(pedidos: readonly PedidoConciliacaoDTO[]): Array<{ numPed: string }> {
  return divergentes(pedidos).map((pedido) => ({ numPed: pedido.numPed }));
}

export const conciliacaoVolta = {
  barras,
  divergentes,
  confirmacoes,
};
