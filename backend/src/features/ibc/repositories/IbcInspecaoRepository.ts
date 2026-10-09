import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import {
  CreateIbcInspecaoData,
  IIbcInspecaoRepository,
  RecalcularAptidaoIbc,
} from "./IIbcInspecaoRepository";
import { IIbcInspecaoLeituraRepository } from "./IIbcInspecaoLeituraRepository";
import {
  IbcAlocacaoAberta,
  IbcAptidaoSnapshot,
  IbcChecklistParaInspecao,
  IbcInspecaoDto,
  IbcInspecaoHistoricoDto,
  IbcInspecaoReprovadaVigente,
} from "../types/IbcInspecao.types";

const aptidaoSelect = {
  aptidao: true,
  motivoInaptidao: true,
  primeiraInspecaoEm: true,
} satisfies Prisma.IbcSelect;

const respostasSnapshot = {
  select: { checklistItemId: true, descricao: true, critico: true, nota: true },
  orderBy: [{ critico: "desc" }, { descricao: "asc" }],
} satisfies Prisma.IbcInspecao$respostasArgs;

const ultimaPrimeiro = [{ inspecionadoEm: "desc" }, { id: "desc" }] satisfies Prisma.IbcInspecaoOrderByWithRelationInput[];

const historicoInclude = {
  checklistModelo: { select: { nome: true } },
  inspetor: { select: { id: true, name: true } },
  respostas: respostasSnapshot,
} satisfies Prisma.IbcInspecaoInclude;

type InspecaoRow = Prisma.IbcInspecaoGetPayload<object>;
type HistoricoRow = Prisma.IbcInspecaoGetPayload<{ include: typeof historicoInclude }>;
type AptidaoRow = Prisma.IbcGetPayload<{ select: typeof aptidaoSelect }>;

export class IbcInspecaoRepository implements IIbcInspecaoRepository, IIbcInspecaoLeituraRepository {
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
        orderBy: ultimaPrimeiro,
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

  async listByIbc(ibcId: string): Promise<IbcInspecaoHistoricoDto[]> {
    const rows = await this.prisma.ibcInspecao.findMany({
      where: { ibcId },
      orderBy: ultimaPrimeiro,
      include: historicoInclude,
    });
    return rows.map(toHistoricoDto);
  }

  async listUltimasReprovadasVinculadas(ibcIds: string[]): Promise<IbcInspecaoReprovadaVigente[]> {
    if (ibcIds.length === 0) return [];
    const [vinculos, ultimas] = await Promise.all([
      this.prisma.ibcChecklistVinculo.findMany({
        where: { ibcId: { in: ibcIds } },
        select: { ibcId: true, checklistModeloId: true },
      }),
      this.prisma.ibcInspecao.findMany({
        where: { ibcId: { in: ibcIds } },
        orderBy: ultimaPrimeiro,
        distinct: ["ibcId", "checklistModeloId"],
        select: { id: true, ibcId: true, checklistModeloId: true, resultado: true },
      }),
    ]);
    const vinculados = new Set(vinculos.map((v) => `${v.ibcId}:${v.checklistModeloId}`));
    const reprovadasIds = ultimas
      .filter((u) => u.resultado === "REPROVADA" && vinculados.has(`${u.ibcId}:${u.checklistModeloId}`))
      .map((u) => u.id);
    if (reprovadasIds.length === 0) return [];

    const reprovadas = await this.prisma.ibcInspecao.findMany({
      where: { id: { in: reprovadasIds } },
      orderBy: [{ ibcId: "asc" }, { inspecionadoEm: "desc" }],
      include: { checklistModelo: { select: { nome: true } }, respostas: respostasSnapshot },
    });
    return reprovadas.map((row) => ({
      ibcId: row.ibcId,
      checklistModeloId: row.checklistModeloId,
      checklistNome: row.checklistModelo.nome,
      mediaObtida: row.mediaObtida,
      notaMinimaCritico: row.notaMinimaCritico,
      mediaMinima: row.mediaMinima,
      respostas: row.respostas,
    }));
  }

  async listAlocacoesAbertas(ibcIds: string[]): Promise<Map<string, IbcAlocacaoAberta>> {
    if (ibcIds.length === 0) return new Map();
    const alocacoes = await this.prisma.alocacaoIbc.findMany({
      where: { ibcId: { in: ibcIds }, expedicaoIbcId: null },
      select: { ibcId: true, numPed: true, carga: { select: { codCar: true } } },
    });
    return new Map(alocacoes.map((a) => [a.ibcId, { codCar: a.carga.codCar, numPed: a.numPed }]));
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

function toHistoricoDto(row: HistoricoRow): IbcInspecaoHistoricoDto {
  return {
    id: row.id,
    checklistModeloId: row.checklistModeloId,
    checklistNome: row.checklistModelo.nome,
    resultado: row.resultado,
    mediaObtida: row.mediaObtida,
    notaMinimaCritico: row.notaMinimaCritico,
    mediaMinima: row.mediaMinima,
    inspetor: { id: row.inspetor.id, nome: row.inspetor.name },
    inspecionadoEm: row.inspecionadoEm.toISOString(),
    observacao: row.observacao,
    respostas: row.respostas,
  };
}

function toAptidaoSnapshot(row: AptidaoRow): IbcAptidaoSnapshot {
  return {
    aptidao: row.aptidao,
    motivoInaptidao: row.motivoInaptidao,
    primeiraInspecaoEm: row.primeiraInspecaoEm?.toISOString() ?? null,
  };
}
