import { formatIsoDateLabel } from "@/utils/formatDate";
import type { CargaEmViagemClienteDTO } from "../types/ibcExpedicao.types";

const VISIBLE_CLIENTES = 3;

/** Data de previsão de saída no card (dd/MM/yyyy), sem hora. */
export function formatCargaPrevisaoSaidaLabel(value: string): string {
  const day = value.includes("T") ? value.slice(0, 10) : value;
  return formatIsoDateLabel(day);
}

export function formatClientesCarga(clientes: readonly CargaEmViagemClienteDTO[]): string {
  const nomes = clientes.map((cliente) => cliente.cliente).filter(Boolean);
  const visible = nomes.slice(0, VISIBLE_CLIENTES);
  const resto = nomes.length - visible.length;
  const label = visible.join(" · ");
  return resto > 0 ? `${label} +${resto}` : label;
}
