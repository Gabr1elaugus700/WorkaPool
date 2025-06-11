import { GetProdutosEstoque } from "../repositories/estoqueProdutosRepository";

export async function getProdutosEstoqueService() {
  const produtos = await GetProdutosEstoque();
  return produtos;
}
