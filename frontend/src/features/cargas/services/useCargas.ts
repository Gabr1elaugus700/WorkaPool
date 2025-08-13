import { Carga } from '@/shared/types/cargas';
import { getBaseUrl } from '@/shared/services/apiBase';


export const fetchCargas = async (): Promise<Carga[]> => {
  const response = await fetch(`${getBaseUrl()}/api/cargas`, {
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
