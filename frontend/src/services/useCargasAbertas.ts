const API = import.meta.env.VITE_API_URL;
import { Carga } from '@/types/cargas';



export const fetchCargasAbertas = async (): Promise<Carga[]> => {
  const response = await fetch(`${API}/api/cargas`, {
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
