const API = import.meta.env.VITE_API_URL;

type Vendedor = {
  COD_REP: number;
  NOME_REP: string;
  APE_REP: string;
};


export const fetchVendedores = async (): Promise<Vendedor[]> => {
  const response = await fetch(`${API}/api/vendedores`, {
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
