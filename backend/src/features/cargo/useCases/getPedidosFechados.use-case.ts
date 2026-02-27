import { buscarPedidosPorVendedor } from '../pedidosFechadosRepository';
import { Pedido } from '../entities/Pedido';
import { mapRawToPedidos } from '../mappers/PedidoMapper';

export const getPedidosFechados = async (codRep: number): Promise<Pedido[]> => {
  try {
    const rows = await buscarPedidosPorVendedor(codRep);
    return mapRawToPedidos(rows);
  } catch (error) {
    console.error('Erro ao buscar pedidos fechados:', error);
    throw new Error('Erro ao buscar pedidos fechados');
  }
};