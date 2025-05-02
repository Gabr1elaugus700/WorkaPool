const API = import.meta.env.VITE_API_URL; // exemplo: http://localhost:3000

export const fetchFaturamento = async (codRep: number, dataInicio: string) => {
  const response = await fetch(`${API}/api/faturamento`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      codRep,
      dataInicio,
    }),
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar faturamento');
  }

  const data = await response.json();
  return data;
};
