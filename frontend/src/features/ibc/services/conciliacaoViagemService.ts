import { apiFetchJson } from "@/lib/apiFetch";
import type {
  ConciliacaoViagemDTO,
  SalvarConciliacaoInput,
} from "../types/conciliacaoViagem.types";

function path(codCar: number, suffix = ""): string {
  return `/api/ibc/expedicoes/${encodeURIComponent(String(codCar))}/conciliacao${suffix}`;
}

export const conciliacaoViagemService = {
  consultar: (codCar: number): Promise<ConciliacaoViagemDTO> => apiFetchJson(path(codCar)),

  salvar: (codCar: number, input: SalvarConciliacaoInput): Promise<ConciliacaoViagemDTO> =>
    apiFetchJson(path(codCar), { method: "PUT", body: JSON.stringify(input) }),

  fechar: (codCar: number): Promise<{ codCar: number; expedicaoIbcId: string; viagemFechadaEm: string }> =>
    apiFetchJson(`/api/ibc/expedicoes/${encodeURIComponent(String(codCar))}/fechar-viagem`, { method: "POST" }),
};
