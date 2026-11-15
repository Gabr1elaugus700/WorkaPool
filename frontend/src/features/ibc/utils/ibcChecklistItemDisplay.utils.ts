import type { IbcChecklistItemRespostaEsperada, IbcChecklistItemTipo } from "../types/ibcChecklist.types";

export function labelChecklistItemTipo(tipo: IbcChecklistItemTipo): string {
  return tipo === "SIM_NAO" ? "Sim/não" : "Numérico";
}

export function labelRespostaEsperada(valor: IbcChecklistItemRespostaEsperada): string {
  return valor === "SIM" ? "Sim" : "Não";
}

export function labelBloqueante(bloqueante: boolean): string {
  return bloqueante ? "Sim" : "Não";
}