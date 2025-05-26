const API = import.meta.env.VITE_API_URL; 
import { Pedido } from '@/types/cargas';
type PedidoERP = {
  NUM_PED: string;
  CLIENTE: string;
  CIDADE: string;
  PESO: number;
  VENDEDOR: string;
  CODCAR: number;
};

export async function fetchPedidosCargas(codCar: string): Promise<Pedido[]> {
  const response = await fetch(`${API}/api/pedidos?codCar=${codCar}`);
  if (!response.ok) throw new Error('Erro ao buscar pedidos dessa Carga');

  const dados: PedidoERP[] = await response.json();

  return dados.map((pedido) => ({
    id: pedido.NUM_PED,
    numPed: pedido.NUM_PED,
    cliente: pedido.CLIENTE,
    cidade: pedido.CIDADE,
    peso: Number(pedido.PESO) || 0, // <-- CORRIGIDO AQUI
    vendedor: pedido.VENDEDOR,
    precoFrete: 0,
    codCar: pedido.CODCAR,
  }));
}
