import { ChecklistItem, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import {
  CreateIbcChecklistItemData,
  IIbcChecklistItemRepository,
  UpdateIbcChecklistItemData,
} from "./IIbcChecklistItemRepository";
import { IbcChecklistItemRecord } from "../types/IbcChecklist.types";

export class IbcChecklistItemRepository implements IIbcChecklistItemRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async list(): Promise<IbcChecklistItemRecord[]> {
    const rows = await this.prisma.checklistItem.findMany({
      orderBy: { descricao: "asc" },
    });
    return rows.map(toChecklistItemRecord);
  }

  async findById(id: string): Promise<IbcChecklistItemRecord | null> {
    const row = await this.prisma.checklistItem.findUnique({ where: { id } });
    return row ? toChecklistItemRecord(row) : null;
  }

  async findManyByIds(ids: string[]): Promise<IbcChecklistItemRecord[]> {
    const rows = await this.prisma.checklistItem.findMany({ where: { id: { in: ids } } });
    return rows.map(toChecklistItemRecord);
  }

  async create(data: CreateIbcChecklistItemData): Promise<IbcChecklistItemRecord> {
    return toChecklistItemRecord(await this.prisma.checklistItem.create({ data }));
  }

  async updateById(
    id: string,
    data: UpdateIbcChecklistItemData,
  ): Promise<IbcChecklistItemRecord> {
    return toChecklistItemRecord(await this.prisma.checklistItem.update({ where: { id }, data }));
  }
}

export function toChecklistItemRecord(row: ChecklistItem): IbcChecklistItemRecord {
  const { id, descricao, critico, ativo } = row;
  return { id, descricao, critico, ativo };
}
