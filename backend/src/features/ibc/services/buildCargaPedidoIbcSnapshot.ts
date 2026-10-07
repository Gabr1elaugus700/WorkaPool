import { PedidoCargo } from "../../pedidos/types/PedidoCargo.types";
import { CargaPedidoIbcSnapshot } from "../types/IbcExpedicao.types";

export function buildCargaPedidoIbcSnapshot(
  pedidos: PedidoCargo[],
): CargaPedidoIbcSnapshot[] {
  const byNumPed = new Map<string, CargaPedidoIbcSnapshot>();

  for (const pedido of pedidos) {
    if (!pedido.isContainer && !pedido.ibcInvalido) continue;

    const numPed = String(pedido.numPed);
    if (byNumPed.has(numPed)) continue;

    byNumPed.set(numPed, {
      numPed,
      codCli: pedido.codCli ?? null,
      cliente: pedido.cliente,
      quantidadeEsperadaTotal: pedido.quantidadeEsperadaTotal,
      quantidadeEsperadaVenda: pedido.quantidadeEsperadaVenda,
      quantidadeEsperadaEmprestimo: pedido.quantidadeEsperadaEmprestimo,
      ibcInvalido: pedido.ibcInvalido,
    });
  }

  return Array.from(byNumPed.values());
}
