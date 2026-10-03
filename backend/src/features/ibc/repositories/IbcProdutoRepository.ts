import { PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { AppError } from "../../../utils/AppError";
import {
  CreateIbcProdutoData,
  IIbcProdutoRepository,
} from "./IIbcProdutoRepository";
import { IbcProdutoRecord } from "../types/IbcCadastro.types";

export class IbcProdutoRepository implements IIbcProdutoRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async create(data: CreateIbcProdutoData): Promise<IbcProdutoRecord> {
    try {
      const created = await this.prisma.ibcProduto.create({ data });
      return this.toRecord(created);
    } catch (error: unknown) {
      this.handlePersistenceError(error);
      throw error;
    }
  }

  async list(): Promise<IbcProdutoRecord[]> {
    const rows = await this.prisma.ibcProduto.findMany({
      orderBy: [{ nome: "asc" }, { abreviacao: "asc" }],
    });
    return rows.map((row) => this.toRecord(row));
  }

  async findById(id: string): Promise<IbcProdutoRecord | null> {
    const row = await this.prisma.ibcProduto.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  private handlePersistenceError(error: unknown): never | void {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("IbcProduto_abreviacao_key")) {
      throw new AppError({
        message: "Abreviação já cadastrada para outro produto",
        statusCode: 409,
        code: "IBC_PRODUTO_ABREVIACAO_DUPLICADA",
      });
    }
  }

  private toRecord(row: {
    id: string;
    nome: string;
    abreviacao: string;
    createdAt: Date;
    updatedAt: Date;
  }): IbcProdutoRecord {
    return {
      id: row.id,
      nome: row.nome,
      abreviacao: row.abreviacao,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
