import { getBaseUrl } from "@/lib/apiBase";
import { CargaComPesoDTO, CargaSituacao, Pedido } from "../types/cargo.types";

export const cargoService = {
  /**
   * Busca TODOS os pedidos fechados (com e sem carga)
   * @param codRep - Código do vendedor (opcional). Se não passar, retorna de todos.
   */
  getTodosPedidosFechados: async (codRep?: number): Promise<Pedido[]> => {
    const url = codRep 
      ? `${getBaseUrl()}/api/cargo/pedidos-fechados?codRep=${codRep}`
      : `${getBaseUrl()}/api/cargo/pedidos-fechados`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao buscar pedidos");
    return response.json();
  },

  /**
   * Busca cargas com filtro de situação opcional
   * @param situacoes - Array de situações para filtrar (ex: ['ABERTA', 'SOLICITADA'])
   */
  getCargas: async (situacoes?: string[]): Promise<CargaComPesoDTO[]> => {
    let url = `${getBaseUrl()}/api/cargo/listar-cargas`;
    
    if (situacoes && situacoes.length > 0) {
      const params = situacoes.map(s => `situacao=${s.toUpperCase()}`).join('&');
      url += `?${params}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao buscar cargas");
    return response.json();
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
    const response = await fetch(`${getBaseUrl()}/api/cargo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao criar carga");
    }

    return response.json();
  },

  /**
   * Atualiza a situação de uma carga
   */
  updateSituacaoCarga: async (id: string, situacao: CargaSituacao): Promise<void> => {
    const response = await fetch(`${getBaseUrl()}/api/cargo/${id}/situacao`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ situacao }),
    });

    if (!response.ok) {
      throw new Error("Erro ao alterar status");
    }
  },

  /**
   * Atualiza os dados completos de uma carga
   */
  updateCarga: async (id: string, data: {
    destino: string;
    pesoMax: number;
    previsaoSaida: string;
    situacao: CargaSituacao;
  }): Promise<CargaComPesoDTO> => {
    const response = await fetch(`${getBaseUrl()}/api/cargo/update-carga/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao atualizar carga");
    }

    return response.json();
  },

  /**
   * Atualiza a carga de um pedido (move pedido para/de uma carga)
   */
  updatePedidoCarga: async (
    numPed: number,
    codCar: number,
    posCar: number
  ): Promise<void> => {
    const response = await fetch(`${getBaseUrl()}/api/cargo/update-pedido/${numPed}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ codCar, posCar }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao atualizar pedido");
    }
  },

  /**
   * Salva pedidos de uma carga fechada (se aplicável ao seu sistema)
   */
  salvarPedidosCargaFechada: async (codCar: string, pedidos: number[]): Promise<void> => {
    const response = await fetch(`${getBaseUrl()}/api/cargo/${codCar}/pedidos-fechados`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pedidos }),
    });

    if (!response.ok) {
      throw new Error("Erro ao salvar pedidos da carga fechada");
    }
  },
};

/**
 * Busca cargas fechadas com seus pedidos
 */
export const fetchCargasFechadas = async () => {
  // Por enquanto, retorna cargas com situação FECHADA
  const cargas = await cargoService.getCargas(["FECHADA"]);
  return cargas.map(carga => ({
    id: carga.id,
    cargaId: carga.id,
    carga: {
      id: carga.id,
      codCar: carga.codCar,
      destino: carga.destino,
      pesoMaximo: carga.pesoMaximo,
      pesoAtual: carga.pesoAtual,
      previsaoSaida: carga.previsaoSaida,
      situacao: carga.situacao as CargaSituacao,
      createdAt: carga.createdAt,
      closedAt: carga.closedAt,
      pedidos: [] // TODO: buscar pedidos se necessário
    },
    pedidos: [] // TODO: adicionar pedidos se necessário
  }));
};
