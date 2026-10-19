import type { CargaEmViagemClienteDTO } from "../types/ibcExpedicao.types";

const VISIBLE_CLIENTES = 3;

export function formatClientesCarga(clientes: readonly CargaEmViagemClienteDTO[]): string {
  const nomes = clientes.map((cliente) => cliente.cliente).filter(Boolean);
  const visible = nomes.slice(0, VISIBLE_CLIENTES);
  const resto = nomes.length - visible.length;
  const label = visible.join(" · ");
  return resto > 0 ? `${label} +${resto}` : label;
}
