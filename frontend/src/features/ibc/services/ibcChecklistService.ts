import { apiFetchJson } from "@/lib/apiFetch";
import type {
  CreateIbcChecklistItemInput,
  IbcChecklistItemDTO,
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
};
