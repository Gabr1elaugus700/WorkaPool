import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { IIbcChecklistVinculoRepository } from "./IIbcChecklistVinculoRepository";
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
