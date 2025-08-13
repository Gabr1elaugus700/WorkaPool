import { getBaseUrl } from '@/lib/apiBase';

export const fetchRankingProdutos = async (codRep: number, dataInicio: string, top: number) => {
  const response = await fetch(`${getBaseUrl()}/api/rankingProdutos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      codRep,
      dataInicio,
      top, 
    }),
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar total de produtos');
  }

  const data = await response.json();
  return data;
};
