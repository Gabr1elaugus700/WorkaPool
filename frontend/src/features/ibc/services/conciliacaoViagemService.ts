import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import type {
  ConciliacaoViagemDTO,
  FecharViagemInput,
  RegistrarTrocaInput,
  SalvarConciliacaoInput,
} from "../types/conciliacaoViagem.types";
import { ibcProdutoCompatibilidade } from "../utils/ibcProdutoCompatibilidade";

function path(codCar: number, suffix = ""): string {
  return `/api/ibc/expedicoes/${encodeURIComponent(String(codCar))}/conciliacao${suffix}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function mensagemFalha(res: Response, fallback: string): Promise<string> {
  if (!res.headers.get("content-type")?.includes("application/json")) return fallback;
  try {
    const body: unknown = await res.json();
    const conflito = ibcProdutoCompatibilidade.mensagemConflito(body, "pedido");
    if (conflito) return conflito;
    if (isRecord(body)) {
      if (typeof body.error === "string" && body.error.trim()) return body.error;
      if (typeof body.message === "string" && body.message.trim()) return body.message;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

async function jsonOuConflito<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  const res = await apiFetch(url, init);
  if (!res.ok) throw new Error(await mensagemFalha(res, fallback));
  return res.json() as Promise<T>;
}

export const conciliacaoViagemService = {
  consultar: (codCar: number): Promise<ConciliacaoViagemDTO> => apiFetchJson(path(codCar)),

  salvar: (codCar: number, input: SalvarConciliacaoInput): Promise<ConciliacaoViagemDTO> =>
    jsonOuConflito(path(codCar), { method: "PUT", body: JSON.stringify(input) }, "Não foi possível salvar a conciliação."),

  fechar: (
    codCar: number,
    input: FecharViagemInput = {},
  ): Promise<{ codCar: number; expedicaoIbcId: string; viagemFechadaEm: string }> =>
    jsonOuConflito(
      `/api/ibc/expedicoes/${encodeURIComponent(String(codCar))}/fechar-viagem`,
      {
        method: "POST",
        body: JSON.stringify(input.confirmacoes?.length ? { confirmacoes: input.confirmacoes } : {}),
      },
      "Não foi possível fechar a viagem.",
    ),

  registrarTroca: (
    codCar: number,
    input: RegistrarTrocaInput,
  ): Promise<{ alocacaoIbcId: string; ibcEntradaId: string; identificador: string }> =>
    apiFetchJson(path(codCar, "/trocas"), { method: "POST", body: JSON.stringify(input) }),
};
