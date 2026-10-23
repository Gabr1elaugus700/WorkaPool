import { Prisma, PrismaClient } from "@prisma/client";
import { FotoPedidoIbcBackfill } from "../services/backfillCargaPedidoIbcGrupos";

const fotoAbertaSemGrupos: Prisma.CargaPedidoIbcWhereInput = {
  gruposCodigo: { isEmpty: true },
  carga: {
    OR: [
      { expedicaoIbc: { is: null } },
      { expedicaoIbc: { is: { viagemFechadaEm: null } } },
    ],
  },
};

export class CargaPedidoIbcGruposBackfillRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listFotos(): Promise<FotoPedidoIbcBackfill[]> {
    const rows = await this.prisma.cargaPedidoIbc.findMany({
      where: fotoAbertaSemGrupos,
      select: {
        id: true,
        numPed: true,
        gruposCodigo: true,
        carga: { select: { expedicaoIbc: { select: { viagemFechadaEm: true } } } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      numPed: row.numPed,
      gruposCodigo: row.gruposCodigo,
      viagemFechada: row.carga.expedicaoIbc?.viagemFechadaEm != null,
    }));
  }

  async saveGrupos(id: string, gruposCodigo: string[]): Promise<void> {
    await this.prisma.cargaPedidoIbc.updateMany({
      where: { id, ...fotoAbertaSemGrupos },
      data: { gruposCodigo },
    });
  }

  async listGruposByProduto(codigos: readonly string[]): Promise<ReadonlyMap<string, string>> {
    if (codigos.length === 0) return new Map();
    const rows = await this.prisma.produtoGrupoMap.findMany({
      where: { produtoCodigo: { in: [...codigos] } },
      select: { produtoCodigo: true, grupoCodigo: true },
    });
    return new Map(rows.map((row) => [row.produtoCodigo.trim(), row.grupoCodigo.trim()]));
  }
}
