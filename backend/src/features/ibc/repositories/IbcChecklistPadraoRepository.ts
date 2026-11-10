import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { IbcChecklistPadraoDto } from "../types/IbcChecklist.types";
import {
  CreateIbcChecklistPadraoData,
  IIbcChecklistPadraoRepository,
} from "./IIbcChecklistPadraoRepository";

const padraoInclude = {
  checklistModelo: { select: { nome: true, ativo: true } },
  vinculadoPor: { select: { id: true, name: true } },
} satisfies Prisma.IbcChecklistPadraoInclude;

type PadraoComRelacoes = Prisma.IbcChecklistPadraoGetPayload<{ include: typeof padraoInclude }>;

export class IbcChecklistPadraoRepository implements IIbcChecklistPadraoRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async listByProduto(produtoId: string): Promise<IbcChecklistPadraoDto[]> {
    const rows = await this.prisma.ibcChecklistPadrao.findMany({
      where: { produtoId, situacao: "ENTRADA_PATIO" },
      orderBy: { checklistModelo: { nome: "asc" } },
      include: padraoInclude,
    });
    return rows.map(toPadraoDto);
  }

  async create(data: CreateIbcChecklistPadraoData): Promise<IbcChecklistPadraoDto | null> {
    try {
      const row = await this.prisma.ibcChecklistPadrao.create({ data, include: padraoInclude });
      return toPadraoDto(row);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return null;
      throw err;
    }
  }

  async delete(produtoId: string, checklistModeloId: string): Promise<boolean> {
    const { count } = await this.prisma.ibcChecklistPadrao.deleteMany({
      where: { produtoId, checklistModeloId, situacao: "ENTRADA_PATIO" },
    });
    return count > 0;
  }
}

function toPadraoDto(row: PadraoComRelacoes): IbcChecklistPadraoDto {
  return {
    checklistModeloId: row.checklistModeloId,
    nome: row.checklistModelo.nome,
    ativo: row.checklistModelo.ativo,
    vinculadoEm: row.vinculadoEm.toISOString(),
    vinculadoPor: { id: row.vinculadoPor.id, nome: row.vinculadoPor.name },
  };
}
