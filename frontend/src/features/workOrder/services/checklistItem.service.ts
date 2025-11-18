import { getBaseUrl } from "@/lib/apiBase";
import { ItemChecklist } from "../models/checklistItem.model";

export const itemChecklistService = {
  getAll: async (): Promise<ItemChecklist[]> => {
    const response = await fetch(`${getBaseUrl()}/api/item-checklist`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const data = await response.json();
    return data; 
  },

  create: async ( descricao: string) => {
    const response = await fetch(`${getBaseUrl()}/api/item-checklist`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ descricao }),
    });
    const data = await response.json();
    return data;
  },
};
