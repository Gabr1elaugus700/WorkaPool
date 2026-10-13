import type { EntradaPatioFilaItem, EntradaPatioOrigem } from "../types/ibcEntradaPatio.types";

export const entradaPatioOrigemLabel = {
  RETORNO: "Retorno",
  TROCA: "Troca",
} as const satisfies Record<EntradaPatioOrigem, string>;

export function entradaProntaParaConcluir(item: Pick<EntradaPatioFilaItem, "checklists">): boolean {
  return item.checklists.length > 0 && item.checklists.every((checklist) => checklist.inspecionada);
}
