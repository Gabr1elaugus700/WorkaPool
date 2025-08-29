import { getBaseUrl } from "@/lib/apiBase"
import { Departamento } from "../models/departamentosModel";


export const departamentosService = {
  getAll: async (): Promise<Departamento[]> => {
    const response = await fetch(`${getBaseUrl()}/api/departamentos`);
    return response.json();
  },
  create: async (data: Departamento): Promise<Departamento> => {
    const response = await fetch(`${getBaseUrl()}/api/departamentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  update: async (id: string, data: Partial<Departamento>): Promise<Departamento> => {
    const response = await fetch(`${getBaseUrl()}/api/departamentos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }
};
