import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import {
  CreateIbcChecklistVinculoData,
  IIbcChecklistVinculoRepository,
} from "./IIbcChecklistVinculoRepository";
import { IbcChecklistVinculoDto } from "../types/IbcChecklist.types";

const vinculoInclude = {
  checklistModelo: { select: { nome: true, ativo: true } },
  vinculadoPor: { select: { id: true, name: true } },
} satisfies Prisma.IbcChecklistVinculoInclude;

type VinculoComRelacoes = Prisma.IbcChecklistVinculoGetPayload<{ include: typeof vinculoInclude }>;

export class IbcChecklistVinculoRepository implements IIbcChecklistVinculoRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async listByIbc(ibcId: string): Promise<IbcChecklistVinculoDto[]> {
    const rows = await this.prisma.ibcChecklistVinculo.findMany({
      where: { ibcId },
      orderBy: { checklistModelo: { nome: "asc" } },
      include: vinculoInclude,
    });
    return rows.map(toVinculoDto);
  }

  async create(data: CreateIbcChecklistVinculoData): Promise<IbcChecklistVinculoDto | null> {
    try {
      const row = await this.prisma.ibcChecklistVinculo.create({ data, include: vinculoInclude });
      return toVinculoDto(row);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return null;
      throw err;
    }
  }

  async delete(ibcId: string, checklistModeloId: string): Promise<boolean> {
    const { count } = await this.prisma.ibcChecklistVinculo.deleteMany({ where: { ibcId, checklistModeloId } });
    return count > 0;
  }
}

function toVinculoDto(row: VinculoComRelacoes): IbcChecklistVinculoDto {
  return {
    checklistModeloId: row.checklistModeloId,
    nome: row.checklistModelo.nome,
    ativo: row.checklistModelo.ativo,
    vinculadoEm: row.vinculadoEm.toISOString(),
    vinculadoPor: { id: row.vinculadoPor.id, nome: row.vinculadoPor.name },
  };
}
