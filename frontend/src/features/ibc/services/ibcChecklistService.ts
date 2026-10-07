import { apiFetchJson } from "@/lib/apiFetch";
import type {
  CreateIbcChecklistInput,
  CreateIbcChecklistItemInput,
  IbcChecklistDTO,
  IbcChecklistItemDTO,
  IbcChecklistSummaryDTO,
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
};
