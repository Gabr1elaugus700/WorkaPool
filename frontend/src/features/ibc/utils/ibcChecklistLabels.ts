import type { IbcChecklistItemRespostaEsperada } from "../types/ibcChecklist.types";

export function labelRespostaSimNao(valor: IbcChecklistItemRespostaEsperada): string {
  return valor === "SIM" ? "Sim" : "Não";
}

export function labelBloqueanteSimNao(bloqueante: boolean | null): string {
  if (bloqueante == null) return "—";
  return bloqueante ? "Sim" : "Não";
}