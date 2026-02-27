import { buscarPedidosPorCarga } from '../pedidosCargasRepository';
import { Pedido } from '../entities/Pedido';
import { mapRawToPedidos } from '../mappers/PedidoMapper';

export const getPedidosPorCarga = async (codCar: number): Promise<Pedido[]> => {
  try {
    const rows = await buscarPedidosPorCarga(codCar);
    return mapRawToPedidos(rows);
  } catch (error) {
    console.error('Erro ao buscar pedidos Por Carga', error);
    throw new Error('Erro ao buscar pedidos dessa Carga!');
  }
};