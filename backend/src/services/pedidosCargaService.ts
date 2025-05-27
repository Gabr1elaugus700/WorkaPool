import { buscarPedidosPorCarga } from '../repositories/pedidosCargasRepository';

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
    CODCAR: number;
    POSCAR: number;
    SITCAR: string;
};

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