import { getBaseUrl } from '@/lib/apiBase';

type Vendedor = {
  COD_REP: number;
  NOME_REP: string;
  APE_REP: string;
};


export const fetchVendedores = async (): Promise<Vendedor[]> => {
  const response = await fetch(`${getBaseUrl()}/api/vendedores`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar Vendedores');
  }

  const data = await response.json();
  return data;
};
