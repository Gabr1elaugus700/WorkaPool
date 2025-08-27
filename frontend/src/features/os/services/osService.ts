import { getBaseUrl } from "@/lib/apiBase";
import { OrdemServico } from "../models/osModel";

export const osService = {
  getAll: async (): Promise<OrdemServico[]> => {
    const response = await fetch(`${getBaseUrl()}/api/os`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const data = await response.json();
    return data;
  },

  create: async (payload: Omit<OrdemServico, "id" | "data_criacao">) => {
    const response = await fetch(`${getBaseUrl()}/api/os`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  },
};
