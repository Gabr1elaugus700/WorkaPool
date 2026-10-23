import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import { ibcPlacaCadastro } from "./ibcPlacaCadastro";
import { isIbcSubstituido } from "./ibcMudanca.utils";

export type IbcPoolSituacao =
  | "todas"
  | "apto"
  | "inapto"
  | "sem_inspecao"
  | "nao_homologado"
  | "baixado"
  | "substituido";

export type IbcPoolFilters = { busca: string; situacao: IbcPoolSituacao; produtoId: string };

const SITUACAO: Record<Exclude<IbcPoolSituacao, "todas">, (ibc: IbcCadastroDTO) => boolean> = {
  apto: (ibc) => ibc.aptidao === "APTO" && !ibc.baixadoEm && !isIbcSubstituido(ibc),
  inapto: (ibc) => ibc.aptidao === "INAPTO",
  sem_inspecao: (ibc) => ibc.primeiraInspecaoEm == null,
  nao_homologado: (ibc) => ibcPlacaCadastro.naoHomologado(ibc),
  baixado: (ibc) => Boolean(ibc.baixadoEm),
  substituido: isIbcSubstituido,
};

export function filterCadastroIbcPool(
  items: readonly IbcCadastroDTO[],
  filters: IbcPoolFilters,
): IbcCadastroDTO[] {
  const busca = filters.busca.trim().toLowerCase();
  const match = filters.situacao === "todas" ? null : SITUACAO[filters.situacao];
  return items.filter((ibc) => {
    if (busca && !ibc.identificador.toLowerCase().includes(busca)) return false;
    if (filters.produtoId && ibc.produtoId !== filters.produtoId) return false;
    return match ? match(ibc) : true;
  });
}
