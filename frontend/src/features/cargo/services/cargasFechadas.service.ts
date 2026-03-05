import { getBaseUrl } from '@/lib/apiBase';
import { CargaFechada } from '../types/cargo.types';

export const fetchCargasFechadas = async (): Promise<CargaFechada[]> => {
  const response = await fetch(`${getBaseUrl()}/api/cargo/cargas-fechadas`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar Cargas Fechadas');
  }

  const data = await response.json();
  return data;
};
