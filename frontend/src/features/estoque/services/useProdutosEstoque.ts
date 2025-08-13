import { getBaseUrl } from '@/shared/services/apiBase';

export type ProdutoEstoque = {
  PRODUTO: string;
  ESTOQUE: number;
};

export async function getProdutosEstoque(): Promise<ProdutoEstoque[]> {
  const res = await fetch(`${getBaseUrl()}/api/produtosEstoque`);

  if (!res.ok) {
    throw new Error("Erro ao buscar produtos em estoque");
  }

  return res.json();
}
