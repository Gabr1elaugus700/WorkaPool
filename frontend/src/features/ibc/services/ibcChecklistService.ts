import { apiFetchJson } from "@/lib/apiFetch";
import type {
  CreateIbcChecklistInput,
  CreateIbcChecklistItemInput,
  IbcChecklistDTO,
  IbcChecklistItemDTO,
  IbcChecklistSummaryDTO,
  IbcChecklistVinculoDTO,
  UpdateIbcChecklistInput,
  UpdateIbcChecklistItemInput,
} from "../types/ibcChecklist.types";

function jsonBody(method: "POST" | "PATCH", body: object): RequestInit {
  return { method, body: JSON.stringify(body) };
}

export const ibcChecklistService = {
  listItens: (): Promise<IbcChecklistItemDTO[]> =>
    apiFetchJson<IbcChecklistItemDTO[]>("/api/ibc/checklist-itens"),

  createItem: (input: CreateIbcChecklistItemInput): Promise<IbcChecklistItemDTO> =>
    apiFetchJson<IbcChecklistItemDTO>("/api/ibc/checklist-itens", jsonBody("POST", input)),

  updateItem: (id: string, input: UpdateIbcChecklistItemInput): Promise<IbcChecklistItemDTO> =>
    apiFetchJson<IbcChecklistItemDTO>(`/api/ibc/checklist-itens/${id}`, jsonBody("PATCH", input)),

  listChecklists: (): Promise<IbcChecklistSummaryDTO[]> =>
    apiFetchJson<IbcChecklistSummaryDTO[]>("/api/ibc/checklists"),

  getChecklist: (id: string): Promise<IbcChecklistDTO> =>
    apiFetchJson<IbcChecklistDTO>(`/api/ibc/checklists/${id}`),

  createChecklist: (input: CreateIbcChecklistInput): Promise<IbcChecklistDTO> =>
    apiFetchJson<IbcChecklistDTO>("/api/ibc/checklists", jsonBody("POST", input)),

  updateChecklist: (id: string, input: UpdateIbcChecklistInput): Promise<IbcChecklistDTO> =>
    apiFetchJson<IbcChecklistDTO>(`/api/ibc/checklists/${id}`, jsonBody("PATCH", input)),

  listVinculos: (ibcId: string): Promise<IbcChecklistVinculoDTO[]> =>
    apiFetchJson<IbcChecklistVinculoDTO[]>(`/api/ibc/${ibcId}/checklists`),

  vincular: (ibcId: string, checklistModeloId: string): Promise<IbcChecklistVinculoDTO> =>
    apiFetchJson<IbcChecklistVinculoDTO>(
      `/api/ibc/${ibcId}/checklists`,
      jsonBody("POST", { checklistModeloId }),
    ),

  desvincular: (ibcId: string, checklistModeloId: string): Promise<void> =>
    apiFetchJson<void>(`/api/ibc/${ibcId}/checklists/${checklistModeloId}`, { method: "DELETE" }),
};
