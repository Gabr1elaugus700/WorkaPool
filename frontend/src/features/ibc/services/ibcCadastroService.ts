import { apiFetchJson } from "@/lib/apiFetch";
import type {
  CreateIbcProdutoInput,
  CreateLoteIbcInput,
  CreateLoteIbcResultDTO,
  CreateNovoIbcInput,
  IbcAlertDTO,
  IbcCadastroDTO,
  IbcProdutoDTO,
} from "../types/ibcCadastro.types";

export const ibcCadastroService = {
  createNovo: (input: CreateNovoIbcInput): Promise<IbcCadastroDTO> =>
    apiFetchJson<IbcCadastroDTO>("/api/ibc", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  createLote: (input: CreateLoteIbcInput): Promise<CreateLoteIbcResultDTO> =>
    apiFetchJson<CreateLoteIbcResultDTO>("/api/ibc/lote", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listPool: (incluirBaixados = false): Promise<IbcCadastroDTO[]> => {
    const query = incluirBaixados ? "?incluirBaixados=true" : "";
    return apiFetchJson<IbcCadastroDTO[]>(`/api/ibc${query}`);
  },

  listAlerts: (): Promise<IbcAlertDTO[]> =>
    apiFetchJson<IbcAlertDTO[]>("/api/ibc/alerts"),

  listProdutos: (): Promise<IbcProdutoDTO[]> =>
    apiFetchJson<IbcProdutoDTO[]>("/api/ibc/produtos"),

  createProduto: (input: CreateIbcProdutoInput): Promise<IbcProdutoDTO> =>
    apiFetchJson<IbcProdutoDTO>("/api/ibc/produtos", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateProduto: (
    id: string,
    input: CreateIbcProdutoInput,
  ): Promise<IbcProdutoDTO> =>
    apiFetchJson<IbcProdutoDTO>(`/api/ibc/produtos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};
