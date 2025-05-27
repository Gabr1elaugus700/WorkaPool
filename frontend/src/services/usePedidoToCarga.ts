const API = import.meta.env.VITE_API_URL;

export async function fetchPedidoToCarga(
  numPed: number,
  codCar?: number,
  posCar?: number
): Promise<void> {
    if (!numPed) {
        throw new Error("Número do pedido é obrigatório");
    }
  const response = await fetch(`${API}/api/pedidoToCarga/${numPed}`, {
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
