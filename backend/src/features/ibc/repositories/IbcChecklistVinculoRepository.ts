import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { IIbcChecklistVinculoRepository } from "./IIbcChecklistVinculoRepository";
import { IbcChecklistVinculoRecord } from "../types/IbcChecklist.types";

const vinculoInclude = {
  checklistModelo: {
    select: { nome: true, ativo: true, _count: { select: { itens: true } } },
  },
} satisfies Prisma.IbcChecklistVinculoInclude;

type VinculoComChecklist = Prisma.IbcChecklistVinculoGetPayload<{ include: typeof vinculoInclude }>;

export class IbcChecklistVinculoRepository implements IIbcChecklistVinculoRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async listByIbc(ibcId: string): Promise<IbcChecklistVinculoRecord[]> {
    const rows = await this.prisma.ibcChecklistVinculo.findMany({
      where: { ibcId },
      orderBy: { checklistModelo: { nome: "asc" } },
      include: vinculoInclude,
    });
    return rows.map(toVinculoRecord);
  }
}

function toVinculoRecord(row: VinculoComChecklist): IbcChecklistVinculoRecord {
  return {
    checklistModeloId: row.checklistModeloId,
    nome: row.checklistModelo.nome,
    ativo: row.checklistModelo.ativo,
    totalItens: row.checklistModelo._count.itens,
    vinculadoPorId: row.vinculadoPorId,
    vinculadoEm: row.vinculadoEm.toISOString(),
  };
}
