import { PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";

export type GrupoCatalogo = { grupoCodigo: string; grupoDescricao: string };

export interface IProdutoGrupoCatalogoRepository {
  listDistinct(): Promise<GrupoCatalogo[]>;
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
}
