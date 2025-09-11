import { getBaseUrl } from "@/lib/apiBase";
import { Vistoria } from "../models/vistoriasModel";
import { ChecklistModelo } from "../models/checklistModel";

export const vistoriasService = {
  getAll: async (): Promise<Vistoria[]> => {
    const response = await fetch(`${getBaseUrl()}/api/vistoria`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  },

  getChecklist: async (): Promise<ChecklistModelo[]> => {
    const response = await fetch(`${getBaseUrl()}/api/checklist-modelo`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  },

  getChecklistModeloById: async (id: string): Promise<ChecklistModelo> => {
    const response = await fetch(`${getBaseUrl()}/api/checklist-modelo/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  },

  createChecklist: async (payload: Omit<Vistoria, "descricao">) => {
    const response = await fetch(`${getBaseUrl()}/api/item-checklist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  },

  createVistoria: async (departamento_id: string, responsavel_id: string, data_vistoria: string) => {
    const response = await fetch(`${getBaseUrl()}/api/vistoria`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ departamento_id, responsavel_id, data_vistoria }),
    });
    const data = await response.json();
    return data;
  },

  getVistoriasByDepartamentoId: async (departamento_id: string): Promise<Vistoria[]> => {
    const response = await fetch(`${getBaseUrl()}/api/vistoria/departamento/${departamento_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }
};
