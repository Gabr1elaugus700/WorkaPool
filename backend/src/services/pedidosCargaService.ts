import { buscarPedidosPorCarga } from '../repositories/pedidosCargasRepository';
import { PedidosFechados } from '../types/cargas';

export const getPedidosPorCarga = async (codCar: number): Promise<PedidosFechados[]> => {
  try {
    const produtosList = await buscarPedidosPorCarga(codCar);

    const produtosMap = produtosList.map(produto => ({
      ...produto,
      PRODUTOS: produto.PRODUTOS?.trim() || '',
    }));

    return produtosMap;
  } catch (error) {
    console.error('Erro ao buscar pedidos Por Carga', error);
    throw new Error('Erro ao buscar pedidos dessa Carga!');
  }
};