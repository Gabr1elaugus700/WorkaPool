import { getBaseUrl } from '@/lib/apiBase';

export async function fetchPedidoToCarga(
  numPed: number,
  codCar?: number,
  posCar?: number
): Promise<void> {
    if (!numPed) {
        throw new Error("Número do pedido é obrigatório");
    }
  const response = await fetch(`${getBaseUrl()}/api/pedidoToCarga/${numPed}`, {
    method: 'PUT',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ codCar, posCar }),
  });

  if (!response.ok) {
    const erro = await response.json();
    throw new Error(erro.error );
  }
}
