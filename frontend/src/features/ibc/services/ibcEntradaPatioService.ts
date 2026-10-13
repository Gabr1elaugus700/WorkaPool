import { apiFetchJson } from "@/lib/apiFetch";
import type { EntradaPatioConcluida, EntradaPatioFilaItem } from "../types/ibcEntradaPatio.types";

export const IBC_ENTRADAS_PATIO_QUERY_KEY = ["ibc", "entradas-patio"] as const;

export const ibcEntradaPatioService = {
  listar: (): Promise<EntradaPatioFilaItem[]> => apiFetchJson<EntradaPatioFilaItem[]>("/api/ibc/entradas-patio"),
  concluir: (ibcId: string): Promise<EntradaPatioConcluida> =>
    apiFetchJson<EntradaPatioConcluida>(`/api/ibc/${ibcId}/entrada-patio/concluir`, { method: "POST" }),
};
