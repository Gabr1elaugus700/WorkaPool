import { ChecklistItem, ChecklistModelo, ChecklistModeloItem, Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { CreateIbcChecklistData, IIbcChecklistRepository } from "./IIbcChecklistRepository";
import { IbcChecklistRecord, IbcChecklistSummary } from "../types/IbcChecklist.types";

const itensInclude = {
  itens: { orderBy: { ordem: "asc" }, include: { checklistItem: true } },
} satisfies Prisma.ChecklistModeloInclude;

type ChecklistModeloComItens = ChecklistModelo & {
  itens: (ChecklistModeloItem & { checklistItem: ChecklistItem })[];
};

function itensCreateData(itensIds: string[]) {
  return itensIds.map((checklistItemId, ordem) => ({ checklistItemId, ordem }));
}

export class IbcChecklistRepository implements IIbcChecklistRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async list(): Promise<IbcChecklistSummary[]> {
    const rows = await this.prisma.checklistModelo.findMany({
      where: { tipo: "IBC" },
      orderBy: { nome: "asc" },
      include: { _count: { select: { itens: true } } },
    });
    return rows.map((row) => ({ ...toChecklistBase(row), totalItens: row._count.itens }));
  }

  async findById(id: string): Promise<IbcChecklistRecord | null> {
    const row = await this.prisma.checklistModelo.findFirst({
      where: { id, tipo: "IBC" },
      include: itensInclude,
    });
    return row ? toChecklistRecord(row) : null;
  }

  async create(data: CreateIbcChecklistData): Promise<IbcChecklistRecord> {
    const { itensIds, ...campos } = data;
    const row = await this.prisma.checklistModelo.create({
      data: { ...campos, tipo: "IBC", itens: { create: itensCreateData(itensIds) } },
      include: itensInclude,
    });
    return toChecklistRecord(row);
  }
}

function toChecklistBase(row: ChecklistModelo): Omit<IbcChecklistSummary, "totalItens"> {
  const { id, nome, notaMinimaCritico, mediaMinima, ativo, createdAt } = row;
  return { id, nome, notaMinimaCritico, mediaMinima, ativo, createdAt: createdAt.toISOString() };
}

function toChecklistRecord(row: ChecklistModeloComItens): IbcChecklistRecord {
  return {
    ...toChecklistBase(row),
    itens: row.itens.map(({ ordem, checklistItem }) => ({
      itemId: checklistItem.id,
      descricao: checklistItem.descricao,
      critico: checklistItem.critico,
      ativo: checklistItem.ativo,
      ordem,
    })),
  };
}
