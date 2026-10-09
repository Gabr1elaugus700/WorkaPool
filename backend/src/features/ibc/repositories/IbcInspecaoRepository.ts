import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import {
  CreateIbcInspecaoData,
  IIbcInspecaoRepository,
  RecalcularAptidaoIbc,
} from "./IIbcInspecaoRepository";
import {
  IbcAlocacaoAberta,
  IbcAptidaoSnapshot,
  IbcChecklistParaInspecao,
  IbcInspecaoDto,
} from "../types/IbcInspecao.types";

const aptidaoSelect = {
  aptidao: true,
  motivoInaptidao: true,
  primeiraInspecaoEm: true,
} satisfies Prisma.IbcSelect;

type InspecaoRow = Prisma.IbcInspecaoGetPayload<object>;
type AptidaoRow = Prisma.IbcGetPayload<{ select: typeof aptidaoSelect }>;

export class IbcInspecaoRepository implements IIbcInspecaoRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async findChecklistVinculado(ibcId: string, checklistModeloId: string): Promise<IbcChecklistParaInspecao | null> {
    const vinculo = await this.prisma.ibcChecklistVinculo.findUnique({
      where: { ibcId_checklistModeloId: { ibcId, checklistModeloId } },
      include: {
        checklistModelo: {
          include: {
            itens: {
              where: { checklistItem: { ativo: true } },
              orderBy: { ordem: "asc" },
              include: { checklistItem: true },
            },
          },
        },
      },
    });
    if (!vinculo) return null;

    const { ativo, notaMinimaCritico, mediaMinima, itens } = vinculo.checklistModelo;
    if (notaMinimaCritico == null || mediaMinima == null) {
      throw new Error(`Checklist ${checklistModeloId} vinculado ao IBC sem limites de nota`);
    }
    return {
      ativo,
      notaMinimaCritico,
      mediaMinima,
      itensAtivos: itens.map(({ checklistItem }) => ({
        checklistItemId: checklistItem.id,
        descricao: checklistItem.descricao,
        critico: checklistItem.critico,
      })),
    };
  }

  async findAlocacaoAberta(ibcId: string): Promise<IbcAlocacaoAberta | null> {
    const alocacao = await this.prisma.alocacaoIbc.findFirst({
      where: { ibcId, expedicaoIbcId: null },
      select: { numPed: true, carga: { select: { codCar: true } } },
    });
    return alocacao ? { codCar: alocacao.carga.codCar, numPed: alocacao.numPed } : null;
  }

  async registrar(
    data: CreateIbcInspecaoData,
    recalcular: RecalcularAptidaoIbc,
  ): Promise<{ inspecao: IbcInspecaoDto; ibc: IbcAptidaoSnapshot }> {
    const { respostas, ...inspecaoData } = data;
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Ibc" WHERE "id" = ${data.ibcId} FOR UPDATE`;
      const inspecao = await tx.ibcInspecao.create({
        data: { ...inspecaoData, respostas: { create: respostas } },
      });

      const estado = await tx.ibc.findUniqueOrThrow({
        where: { id: data.ibcId },
        select: { motivoInaptidao: true, dataLimite: true, primeiraInspecaoEm: true },
      });
      const ultimas = await tx.ibcInspecao.findMany({
        where: { ibcId: data.ibcId, checklistModelo: { ibcVinculos: { some: { ibcId: data.ibcId } } } },
        orderBy: [{ inspecionadoEm: "desc" }, { id: "desc" }],
        distinct: ["checklistModeloId"],
        select: { resultado: true },
      });
      const atualizacao = recalcular({
        ...estado,
        ultimasPorChecklistVinculado: ultimas.map((u) => u.resultado),
      });

      const ibc = await tx.ibc.update({ where: { id: data.ibcId }, data: atualizacao, select: aptidaoSelect });
      return { inspecao: toInspecaoDto(inspecao, data), ibc: toAptidaoSnapshot(ibc) };
    });
  }
}

function toInspecaoDto(row: InspecaoRow, data: CreateIbcInspecaoData): IbcInspecaoDto {
  return {
    id: row.id,
    ibcId: row.ibcId,
    checklistModeloId: row.checklistModeloId,
    resultado: row.resultado,
    mediaObtida: row.mediaObtida,
    notaMinimaCritico: row.notaMinimaCritico,
    mediaMinima: row.mediaMinima,
    inspetorId: row.inspetorId,
    inspecionadoEm: row.inspecionadoEm.toISOString(),
    observacao: row.observacao,
    respostas: data.respostas,
  };
}

function toAptidaoSnapshot(row: AptidaoRow): IbcAptidaoSnapshot {
  return {
    aptidao: row.aptidao,
    motivoInaptidao: row.motivoInaptidao,
    primeiraInspecaoEm: row.primeiraInspecaoEm?.toISOString() ?? null,
  };
}
