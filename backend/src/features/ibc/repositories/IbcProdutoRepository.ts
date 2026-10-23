import { PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { IbcProdutoRecord } from "../types/IbcCadastro.types";
import { IIbcProdutoRepository } from "./IIbcProdutoRepository";

export type IbcProdutoConfigRecord = {
  id: string; grupoCodigo: string | null; sigla: string | null; corHex: string; universal: boolean; emUso: boolean;
};

export type SaveIbcProdutoConfig =
  | { id?: string; universal: true; corHex: string }
  | { id?: string; universal: false; grupoCodigo: string; sigla: string; corHex: string };

export interface IIbcProdutoConfigRepository {
  list(): Promise<IbcProdutoConfigRecord[]>;
  findByGrupoCodigo(grupoCodigo: string): Promise<IbcProdutoConfigRecord | null>;
  findUniversal(): Promise<IbcProdutoConfigRecord | null>;
  save(input: SaveIbcProdutoConfig): Promise<IbcProdutoConfigRecord>;
}

const configInclude = { _count: { select: { ibcs: true } } } as const;

function toConfig(row: {
  id: string; grupoCodigo: string | null; sigla: string | null; corHex: string; universal: boolean; _count: { ibcs: number };
}): IbcProdutoConfigRecord {
  return {
    id: row.id, grupoCodigo: row.grupoCodigo, sigla: row.sigla?.toUpperCase() ?? null,
    corHex: row.corHex.toUpperCase(), universal: row.universal, emUso: row._count.ibcs > 0,
  };
}

export class IbcProdutoRepository implements IIbcProdutoRepository, IIbcProdutoConfigRepository {
  constructor(private readonly prisma: PrismaClient = prismaInstance) {}

  async findById(id: string): Promise<IbcProdutoRecord | null> {
    const row = await this.prisma.ibcProduto.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id, nome: row.universal ? "Universal" : (row.grupoCodigo ?? ""),
      abreviacao: row.sigla?.toUpperCase() ?? "", createdAt: row.createdAt, updatedAt: row.updatedAt,
    };
  }

  list(): Promise<IbcProdutoConfigRecord[]> {
    return this.prisma.ibcProduto.findMany({ include: configInclude }).then((rows) => rows.map(toConfig));
  }

  async findByGrupoCodigo(grupoCodigo: string): Promise<IbcProdutoConfigRecord | null> {
    const row = await this.prisma.ibcProduto.findUnique({ where: { grupoCodigo }, include: configInclude });
    return row && !row.universal ? toConfig(row) : null;
  }

  async findUniversal(): Promise<IbcProdutoConfigRecord | null> {
    const row = await this.prisma.ibcProduto.findFirst({ where: { universal: true }, include: configInclude });
    return row ? toConfig(row) : null;
  }

  async save(input: SaveIbcProdutoConfig): Promise<IbcProdutoConfigRecord> {
    const data = input.universal
      ? { grupoCodigo: null, sigla: null, corHex: input.corHex, universal: true }
      : { grupoCodigo: input.grupoCodigo, sigla: input.sigla, corHex: input.corHex, universal: false };
    const row = input.id
      ? await this.prisma.ibcProduto.update({ where: { id: input.id }, data, include: configInclude })
      : await this.prisma.ibcProduto.create({ data, include: configInclude });
    return toConfig(row);
  }
}
