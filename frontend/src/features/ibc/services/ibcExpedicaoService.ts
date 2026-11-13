import { getBaseUrl } from "@/lib/apiBase";
import { apiFetch, apiFetchJson } from "@/lib/apiFetch";
import { IbcAlocacaoRequestError } from "../utils/ibcAlocacaoError";
import type {
  CargaEmViagemListItemDTO,
  CargaExpedicaoDetalheDTO,
  CargaExpedicaoListItemDTO,
  ContainersCargaDTO,
  CreateAlocacaoIbcInput,
  CreateAlocacaoIbcResultDTO,
  FecharExpedicaoIbcInput,
  FecharExpedicaoIbcResultDTO,
  ListCargasEmViagemResponseDTO,
  ListCargasExpedicaoResponseDTO,
  RelatorioViagemDTO,
} from "../types/ibcExpedicao.types";

function normalizeListResponse(
  data: CargaExpedicaoListItemDTO[] | ListCargasExpedicaoResponseDTO,
): CargaExpedicaoListItemDTO[] {
  if (Array.isArray(data)) return data;
  return data.cargas ?? [];
}

export const ibcExpedicaoService = {
  listCargasExpedicao: async (): Promise<CargaExpedicaoListItemDTO[]> => {
    const data = await apiFetchJson<
      CargaExpedicaoListItemDTO[] | ListCargasExpedicaoResponseDTO
    >("/api/ibc/cargas-expedicao");
    return normalizeListResponse(data);
  },

  listCargasEmViagem: async (): Promise<CargaEmViagemListItemDTO[]> => {
    const data = await apiFetchJson<
      CargaEmViagemListItemDTO[] | ListCargasEmViagemResponseDTO
    >("/api/ibc/expedicoes/em-viagem");
    if (Array.isArray(data)) return data;
    return data.cargas ?? [];
  },

  getCargaExpedicao: async (
    codCar: number,
  ): Promise<CargaExpedicaoDetalheDTO> => {
    return apiFetchJson<CargaExpedicaoDetalheDTO>(
      `/api/ibc/cargas-expedicao/${encodeURIComponent(String(codCar))}`,
    );
  },

  getContainersCarga: async (codCar: number): Promise<ContainersCargaDTO> => {
    return apiFetchJson<ContainersCargaDTO>(
      `/api/ibc/cargas-expedicao/${encodeURIComponent(String(codCar))}/containers`,
    );
  },

  createAlocacao: async (
    input: CreateAlocacaoIbcInput,
  ): Promise<CreateAlocacaoIbcResultDTO> => {
    const res = await apiFetch("/api/ibc/alocacoes", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw await IbcAlocacaoRequestError.fromResponse(res);
    }
    return res.json() as Promise<CreateAlocacaoIbcResultDTO>;
  },

  removeAlocacao: async (id: string): Promise<void> => {
    await apiFetchJson(`/api/ibc/alocacoes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  getRelatorioViagem: async (codCar: number): Promise<RelatorioViagemDTO> => {
    return apiFetchJson<RelatorioViagemDTO>(
      `/api/ibc/expedicoes/${encodeURIComponent(String(codCar))}/relatorio-viagem`,
    );
  },

  fecharExpedicao: async (
    input: FecharExpedicaoIbcInput,
  ): Promise<FecharExpedicaoIbcResultDTO> => {
    return apiFetchJson<FecharExpedicaoIbcResultDTO>("/api/ibc/expedicoes", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  openEventStream: (token: string, signal: AbortSignal): Promise<Response> =>
    fetch(`${getBaseUrl()}/api/ibc/events`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }),
};
