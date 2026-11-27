/** Nome do vendedor gravado em `CargasFechadas.pedidos` no fechamento da carga. */
export function vendedoresPorPedido(pedidos: unknown): Map<string, string> {
  const mapa = new Map<string, string>();
  if (!Array.isArray(pedidos)) return mapa;

  for (const pedido of pedidos) {
    if (!isRecord(pedido)) continue;
    const numPed = numPedDe(pedido.numPed);
    const nome = typeof pedido.vendedor === "string" ? pedido.vendedor.trim() : "";
    if (numPed == null || nome.length === 0 || mapa.has(numPed)) continue;
    mapa.set(numPed, nome);
  }

  return mapa;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numPedDe(valor: unknown): string | null {
  if (typeof valor === "string" && valor.trim().length > 0) return valor;
  if (typeof valor === "number" && Number.isInteger(valor)) return String(valor);
  return null;
}
