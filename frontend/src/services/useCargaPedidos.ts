import { getBaseUrl } from "@/lib/apiBase";


export async function salvarPedidosCargaFechada(codCar: string, pedidos: number[]) {
  const response = await fetch(`${getBaseUrl()}/api/Cargas/carga-pedidos/${codCar}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pedidos }),
  });

  if (!response.ok) {
    throw new Error('Erro ao salvar pedidos na carga.');
  }

  return response.json();
}