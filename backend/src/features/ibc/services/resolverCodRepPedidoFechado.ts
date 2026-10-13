export function resolverCodRepPedidoFechado(pedidos: unknown, numPed: string): number | null {
  if (!Array.isArray(pedidos)) return null;

  for (const pedido of pedidos) {
    if (!isRecord(pedido) || !mesmoNumPed(pedido.numPed, numPed)) continue;
    return codRepValido(pedido.codRep);
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mesmoNumPed(valor: unknown, numPed: string): boolean {
  if (typeof valor === "string") return valor === numPed;
  return typeof valor === "number" && Number.isInteger(valor) && String(valor) === numPed;
}

function codRepValido(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isInteger(valor) || valor <= 0) return null;
  return valor;
}
