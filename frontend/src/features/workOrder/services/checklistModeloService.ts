import { getBaseUrl } from "@/lib/apiBase";
import { ModeloChecklist } from "../models/modeloChecklistModel";

export const checklistModeloService = {
  getAll: async (): Promise<ModeloChecklist[]> => {
    const response = await fetch(`${getBaseUrl()}/api/checklist-modelo`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const data = await response.json();
    return data;
  },

  create: async ( nome: string, itens: string[] ) => {
    const response = await fetch(`${getBaseUrl()}/api/checklist-modelo`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, itens }),
    });
    const data = await response.json();
    return data;
  },
};
