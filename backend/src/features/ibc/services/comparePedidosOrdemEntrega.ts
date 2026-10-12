type PedidoOrdemEntrega = {
  posCar: number | null;
  numPed: string;
};

/**
 * Ordem de entrega do relatório de viagem: menor `posCar`;
 * sem `posCar`, menor `numPed`. A #37 reutiliza esta comparação.
 */
export function comparePedidosOrdemEntrega(
  a: PedidoOrdemEntrega,
  b: PedidoOrdemEntrega,
): number {
  const posA = a.posCar ?? Number.POSITIVE_INFINITY;
  const posB = b.posCar ?? Number.POSITIVE_INFINITY;
  if (posA !== posB) return posA - posB;
  return a.numPed.localeCompare(b.numPed, undefined, { numeric: true });
}
