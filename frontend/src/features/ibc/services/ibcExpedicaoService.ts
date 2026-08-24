import { apiFetchJson } from "@/lib/apiFetch";
import type {
  CargaExpedicaoDetalheDTO,
  CargaExpedicaoListItemDTO,
  CreateAlocacaoIbcInput,
  CreateAlocacaoIbcResultDTO,
  FecharExpedicaoIbcInput,
  FecharExpedicaoIbcResultDTO,
  ListCargasExpedicaoResponseDTO,
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

  getCargaExpedicao: async (
    codCar: number,
  ): Promise<CargaExpedicaoDetalheDTO> => {
    return apiFetchJson<CargaExpedicaoDetalheDTO>(
      `/api/ibc/cargas-expedicao/${encodeURIComponent(String(codCar))}`,
    );
  },

  createAlocacao: async (
    input: CreateAlocacaoIbcInput,
  ): Promise<CreateAlocacaoIbcResultDTO> => {
    return apiFetchJson<CreateAlocacaoIbcResultDTO>("/api/ibc/alocacoes", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  removeAlocacao: async (id: string): Promise<void> => {
    await apiFetchJson(`/api/ibc/alocacoes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  fecharExpedicao: async (
    input: FecharExpedicaoIbcInput,
  ): Promise<FecharExpedicaoIbcResultDTO> => {
    return apiFetchJson<FecharExpedicaoIbcResultDTO>("/api/ibc/expedicoes", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
