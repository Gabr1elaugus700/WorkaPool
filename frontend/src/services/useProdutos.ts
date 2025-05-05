const API = import.meta.env.VITE_API_URL;

type Produto = {
  COD_GRUPO: string;
    PRODUTOS: string;
}

export const fetchProdutos = async (): Promise<Produto[]> => {
  const response = await fetch(`${API}/api/produtos`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar total de produtos');
  }

  const data = await response.json();
  return data;
};
