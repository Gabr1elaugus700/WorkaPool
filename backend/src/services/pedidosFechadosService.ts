import { buscarPedidosPorVendedor } from '../repositories/pedidosFechadosRepository';
import { PedidosFechados } from '../types/cargas'


export const getPedidosFechados = async (codRep: number): Promise<PedidosFechados[]> => {
  try {
    const produtosList = await buscarPedidosPorVendedor(codRep);

    const produtosMap = produtosList.map(produto => ({
      ...produto,
      PRODUTOS: produto.PRODUTOS?.trim() || '',
    }));
    // console.log('Produtos Fechados:', produtosMap);
    return produtosMap;
  } catch (error) {
    console.error('Erro ao buscar pedidos fechados:', error);
    throw new Error('Erro ao buscar pedidos fechados');
  }
};