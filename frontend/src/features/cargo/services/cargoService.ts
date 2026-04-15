import { apiFetchJson } from "@/lib/apiFetch";
import {
  CargaComPesoDTO,
  CargaFechadaData,
  CargaSituacao,
  Pedido,
} from "../types/cargo.types";

export const cargoService = {
  /**
   * Busca TODOS os pedidos fechados (com e sem carga)
   * @param codRep - Código do vendedor (opcional). Se não passar, retorna de todos.
   */
  getTodosPedidosFechados: async (codRep?: number): Promise<Pedido[]> => {
    const path =
      codRep != null
        ? `/api/cargo/pedidos-fechados?codRep=${encodeURIComponent(String(codRep))}`
        : "/api/cargo/pedidos-fechados";
    return apiFetchJson<Pedido[]>(path);
  },

  /**
   * Busca cargas com filtro de situação opcional
   * @param situacoes - Array de situações para filtrar (ex: ['ABERTA', 'SOLICITADA'])
   */
  getCargas: async (situacoes?: string[]): Promise<CargaComPesoDTO[]> => {
    let path = "/api/cargo/listar-cargas";
    if (situacoes && situacoes.length > 0) {
      path += `?${situacoes.map((s) => `situacao=${encodeURIComponent(s.toUpperCase())}`).join("&")}`;
    }
    return apiFetchJson<CargaComPesoDTO[]>(path);
  },

  /**
   * Cria uma nova carga
   */
  createCarga: async (input: {
    destino: string;
    pesoMax: number;
    situacao: string;
    previsaoSaida: string;
  }): Promise<CargaComPesoDTO> => {
    return apiFetchJson<CargaComPesoDTO>("/api/cargo", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /**
   * Atualiza a situação de uma carga (backend: PATCH /api/cargo/:codCar/situacao)
   */
  updateSituacaoCarga: async (
    codCar: number,
    situacao: CargaSituacao,
  ): Promise<void> => {
    await apiFetchJson(`/api/cargo/${encodeURIComponent(String(codCar))}/situacao`, {
      method: "PATCH",
      body: JSON.stringify({ situacao }),
    });
  },

  /**
   * Atualiza os dados completos de uma carga
   */
  updateCarga: async (
    id: string,
    data: {
      destino: string;
      pesoMax: number;
      previsaoSaida: string;
      situacao: CargaSituacao;
    },
  ): Promise<CargaComPesoDTO> => {
    return apiFetchJson<CargaComPesoDTO>(`/api/cargo/update-carga/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Atualiza a carga de um pedido (move pedido para/de uma carga)
   */
  updatePedidoCarga: async (
    numPed: number,
    codCar: number,
    posCar: number,
  ): Promise<void> => {
    await apiFetchJson(`/api/cargo/update-pedido/${encodeURIComponent(String(numPed))}`, {
      method: "PUT",
      body: JSON.stringify({ codCar, posCar }),
    });
  },

  /**
   * Fecha uma carga salvando todos os pedidos vinculados
   */
  closeCarga: async (
    codCar: number,
  ): Promise<{ message: string; pedidosSalvos: number }> => {
    return apiFetchJson<{ message: string; pedidosSalvos: number }>(
      "/api/cargo/close-carga",
      {
        method: "POST",
        body: JSON.stringify({ codCar }),
      },
    );
  },

  /**
   * Busca cargas fechadas com seus pedidos salvos
   */
  getCargasFechadas: async (): Promise<CargaFechadaData[]> => {
    return apiFetchJson<CargaFechadaData[]>("/api/cargo/cargas-fechadas");
  },

};
