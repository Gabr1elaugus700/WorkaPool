import { getBaseUrl } from "@/lib/apiBase";
import { Vistoria } from "../models/vistoriasModel";

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

  create: async (payload: Omit<Vistoria, "descricao">) => {
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
