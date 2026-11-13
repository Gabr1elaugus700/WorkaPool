import { PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";

export type GrupoCatalogo = { grupoCodigo: string; grupoDescricao: string };

export interface IProdutoGrupoCatalogoRepository {
  listDistinct(): Promise<GrupoCatalogo[]>;
  hasGrupo(grupoCodigo: string): Promise<boolean>;
}

export class ProdutoGrupoCatalogoRepository implements IProdutoGrupoCatalogoRepository {
  constructor(private readonly prisma: PrismaClient = prismaInstance) {}

  listDistinct(): Promise<GrupoCatalogo[]> {
    return this.prisma.$queryRaw<GrupoCatalogo[]>`
      SELECT DISTINCT grupo_codigo AS "grupoCodigo", grupo_descricao AS "grupoDescricao"
      FROM produto_grupo_map
      ORDER BY grupo_descricao, grupo_codigo
    `;
  }

  async hasGrupo(grupoCodigo: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<Array<{ ok: number }>>`
      SELECT 1 AS ok FROM produto_grupo_map WHERE grupo_codigo = ${grupoCodigo} LIMIT 1
    `;
    return rows.length > 0;
  }

  async listDescricoes(
    grupos: readonly string[],
  ): Promise<{ grupoCodigo: string; grupoDescricao: string }[]> {
    const codigos = [...new Set(grupos.map((grupo) => grupo.trim()).filter((grupo) => grupo.length > 0))];
    if (codigos.length === 0) return [];
    return this.prisma.$queryRaw<{ grupoCodigo: string; grupoDescricao: string }[]>`
      SELECT DISTINCT ON (grupo_codigo)
        grupo_codigo AS "grupoCodigo",
        grupo_descricao AS "grupoDescricao"
      FROM produto_grupo_map
      WHERE grupo_codigo = ANY(${codigos}::varchar[])
      ORDER BY grupo_codigo, grupo_descricao
    `;
  }
}
