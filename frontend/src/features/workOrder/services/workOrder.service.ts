import { getBaseUrl } from "@/lib/apiBase";
import { OrdemServico } from "../models/workOrder.model";

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

  create: async (data: OrdemServico) => {

    const formData = new FormData();

    formData.append('descricao', data.descricao);
    formData.append('problema', data.problema);

    if (data.localizacao) formData.append('localizacao', data.localizacao);
    if (data.id_departamento) formData.append('id_departamento', data.id_departamento);
    if (data.email_solicitante) formData.append('email_solicitante', data.email_solicitante);
    if (data.id_solicitante) formData.append('id_solicitante', data.id_solicitante);
    if (data.id_vistoria) formData.append('id_vistoria', data.id_vistoria);
    if (data.status) formData.append('status', data.status);
    if (data.prioridade) formData.append('prioridade', data.prioridade);
    if (data.imagens) {
      data.imagens.forEach(file => {
        formData.append('imagens', file);
      });
    }
    const response = await fetch(`${getBaseUrl()}/api/os`, {
      method: "POST",
      body: formData,
    });
    const responseData = await response.json();
    return responseData;
  },

  getById: async (id: string): Promise<OrdemServico> => {
    const response = await fetch(`${getBaseUrl()}/api/os/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  },

  update: async (id: string, data: Partial<OrdemServico>) => {
    const response = await fetch(`${getBaseUrl()}/api/os/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    return responseData;
  }
};
