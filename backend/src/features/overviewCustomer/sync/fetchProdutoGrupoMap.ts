import type { OverviewCustomerProdutoGrupoMapRow } from "./materializeOverviewCustomerWinsByGroup";

export type ProdutoGrupoMapClient = {
  produtoGrupoMap: {
    findMany: () => Promise<OverviewCustomerProdutoGrupoMapRow[]>;
  };
};

export async function fetchProdutoGrupoMap(
  prisma: ProdutoGrupoMapClient,
): Promise<OverviewCustomerProdutoGrupoMapRow[]> {
  const rows = await prisma.produtoGrupoMap.findMany();
  return rows.map((row) => ({
    produtoCodigo: row.produtoCodigo,
    grupoCodigo: row.grupoCodigo,
    grupoDescricao: row.grupoDescricao,
  }));
}
