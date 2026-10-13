import type { ConciliacaoViagemClienteDTO, ConciliacaoViagemItemDTO } from "../types/conciliacaoViagem.types";

function contarTrocas(
  itens: ConciliacaoViagemItemDTO[],
  cliente: Pick<ConciliacaoViagemClienteDTO, "codCli" | "cliente">,
): number {
  return itens.filter(
    (item) => item.destino === "TROCA" && item.codCli === cliente.codCli && item.cliente === cliente.cliente,
  ).length;
}

function lerQuantidadePapel(raw: string): number | null {
  if (!/^\d{1,3}$/.test(raw)) return null;
  const quantidade = Number(raw);
  return quantidade <= 999 ? quantidade : null;
}

export const conciliacaoRetornos = {
  contarTrocas,
  lerQuantidadePapel,
};
