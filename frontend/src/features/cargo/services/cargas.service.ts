import { Carga, CargaComPesoDTO, toCarga } from '../types/cargo.types';
import { getBaseUrl } from '@/lib/apiBase';

export const fetchCargas = async (): Promise<Carga[]> => {
  const response = await fetch(`${getBaseUrl()}/api/cargo/listarAbertas`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar Cargas Abertas');
  }

  // Backend agora retorna CargaComPesoDTO com pesoAtual calculado
  const data: CargaComPesoDTO[] = await response.json();
  return data.map(dto => ({
    ...toCarga(dto, []),  // Conversão básica
    pesoAtual: dto.pesoAtual,  // Peso REAL (todos os vendedores)
    pedidos: []  // Será preenchido depois com pedidos filtrados
  }));
};

export const createCarga = async (input: {
  destino: string;
  pesoMaximo: number;
  situacao: string;
  previsaoSaida: string;
}): Promise<Carga> => {
  const response = await fetch(`${getBaseUrl()}/api/cargo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Erro ao criar carga');
  }

  const dto: CargaComPesoDTO = await response.json();
  return {
    ...toCarga(dto, []),
    pesoAtual: dto.pesoAtual,
    pedidos: []
  };
};

export const updateSituacaoCarga = async (id: string, situacao: string): Promise<void> => {
  const response = await fetch(`${getBaseUrl()}/api/cargo/${id}/situacao`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    }, 
    body: JSON.stringify({ situacao }),
  });

  if (!response.ok) {
    throw new Error('Erro ao alterar status');
  }
};
