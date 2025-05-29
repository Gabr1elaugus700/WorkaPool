const API = import.meta.env.VITE_API_URL;

export const fetchUpdateSitCar = async (id: string, situacao: string): Promise<void[]> => {
  const response = await fetch(`${API}/api/cargas/${id}/situacao`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    }, 
    body: JSON.stringify({
      situacao
    }),
  });

  if (!response.ok) {
    throw new Error('Erro Alterar Status');
  }

  const data = await response.json();
  return data;
};
