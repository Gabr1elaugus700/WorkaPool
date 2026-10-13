import { apiFetchJson } from "@/lib/apiFetch";
import type {
  AvisoRepresentante,
  ListaAvisosRepresentante,
} from "../types/avisoRepresentante.types";

export const avisoRepresentanteService = {
  listar: (): Promise<ListaAvisosRepresentante> =>
    apiFetchJson<ListaAvisosRepresentante>("/api/ibc/avisos"),

  marcarLido: (id: string): Promise<AvisoRepresentante> =>
    apiFetchJson<AvisoRepresentante>(`/api/ibc/avisos/${encodeURIComponent(id)}/lido`, {
      method: "PATCH",
    }),
};
