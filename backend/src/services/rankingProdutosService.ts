import { buscarTotalProdutos } from '../repositories/totalProdutosRepository';

type ProdutoRanking = {
  PRODUTO: string;
  QUANTIDADE: number;
};

export const getRankingProdutos = async (codRep: number, dataInicio: Date, top: number) => {
  const todos: ProdutoRanking[] = await buscarTotalProdutos(codRep, dataInicio);
  
  const topSorted = todos
    .map(item => ({
      ...item,
      QUANTIDADE: Number(item.QUANTIDADE)
    }))
    .sort((a, b) => b.QUANTIDADE - a.QUANTIDADE)
    .slice(0, top);


  return topSorted;
};
