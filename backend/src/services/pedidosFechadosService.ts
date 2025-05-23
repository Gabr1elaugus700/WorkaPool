import { buscarTotalProdutos } from '../repositories/pedidosFechadosRepository';

type PedidosFechados = {
    NUM_PED: string;
    COD_CLI: string;
    CLIENTE: string;
    CIDADE: string;
    ESTADO: string;
    VENDEDOR: string;
    COD_VEN: number;
    BLOQUEADO: number;
    PESO: number;
    PRODUTOS: string;
    DERIVACAO: string;
    QUANTIDADE: number;
};

export const getPedidosFechados = async (codRep: number): Promise<PedidosFechados[]> => {
  try {
    const produtosList = await buscarTotalProdutos(codRep);

    const produtosMap = produtosList.map(produto => ({
      ...produto,
      PRODUTOS: produto.PRODUTOS?.trim() || '',
    }));

    return produtosMap;
  } catch (error) {
    console.error('Erro ao buscar pedidos fechados:', error);
    throw new Error('Erro ao buscar pedidos fechados');
  }
};