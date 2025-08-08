import { getBaseUrl } from '@/lib/apiBase';
import { CargaFechada } from "@/types/cargasFechadasPedido";

export const fetchCargasFechadas = async (): Promise<CargaFechada[]> => {
  const response = await fetch(`${getBaseUrl()}/api/cargas/pedidosCargaFechada`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar Cargas Abertas');
  }

  const data = await response.json();
  return data;
};
