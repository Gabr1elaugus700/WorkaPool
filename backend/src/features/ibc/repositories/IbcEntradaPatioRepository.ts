import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { AppError } from "../../../utils/AppError";
import {
  ChecklistDaEntrada,
  DecidirAberturaEntrada,
  DecidirConclusaoEntrada,
  EntradaParaConcluir,
  EntradaPatioAberta,
  EntradaPatioConcluida,
  EntradaPatioFilaItem,
  IbcParaAbrirEntrada,
  InspecaoDaEntrada,
} from "../types/IbcEntradaPatio.types";
import { IIbcEntradaPatioRepository } from "./IIbcEntradaPatioRepository";

const ibcSelect = {
  id: true,
  identificador: true,
  baixadoEm: true,
  custodia: true,
  aptidao: true,
  motivoInaptidao: true,
  dataLimite: true,
  tipoCadastro: true,
  aquisicao: true,
} satisfies Prisma.IbcSelect;

type IbcRow = Prisma.IbcGetPayload<{ select: typeof ibcSelect }>;

export class IbcEntradaPatioRepository implements IIbcEntradaPatioRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async abrir(
    ibcId: string,
    decidir: DecidirAberturaEntrada,
    db?: Prisma.TransactionClient,
  ): Promise<EntradaPatioAberta> {
    const run = (tx: Prisma.TransactionClient) => this.abrirNaTransacao(tx, ibcId, decidir);
    return db ? run(db) : this.prisma.$transaction(run);
  }

  async listPendentes(): Promise<EntradaPatioFilaItem[]> {
    const rows = await this.prisma.entradaPatioIbc.findMany({
      where: { status: "PENDENTE" },
      orderBy: { abertoEm: "asc" },
      include: {
        ibc: {
          select: {
            identificador: true,
            motivoInaptidao: true,
            checklistVinculos: {
              where: { checklistModelo: { ativo: true } },
              orderBy: { checklistModelo: { nome: "asc" } },
              select: { checklistModeloId: true, checklistModelo: { select: { nome: true } } },
            },
          },
        },
        inspecoes: { select: { checklistModeloId: true } },
      },
    });
    return rows.map((row) => {
      const feitas = new Set(row.inspecoes.map((inspecao) => inspecao.checklistModeloId));
      return {
        id: row.id,
        ibcId: row.ibcId,
        identificador: row.ibc.identificador,
        origem: row.origem,
        abertoEm: row.abertoEm,
        motivoInaptidao: row.ibc.motivoInaptidao,
        checklists: row.ibc.checklistVinculos.map((vinculo) => ({
          checklistModeloId: vinculo.checklistModeloId,
          nome: vinculo.checklistModelo.nome,
          inspecionada: feitas.has(vinculo.checklistModeloId),
        })),
      };
    });
  }

  async concluir(
    ibcId: string,
    decidir: DecidirConclusaoEntrada,
    db?: Prisma.TransactionClient,
  ): Promise<EntradaPatioConcluida> {
    const run = (tx: Prisma.TransactionClient) => this.concluirNaTransacao(tx, ibcId, decidir);
    return db ? run(db) : this.prisma.$transaction(run);
  }

  private async abrirNaTransacao(
    tx: Prisma.TransactionClient,
    ibcId: string,
    decidir: DecidirAberturaEntrada,
  ): Promise<EntradaPatioAberta> {
    await tx.$queryRaw`SELECT "id" FROM "Ibc" WHERE "id" = ${ibcId} FOR UPDATE`;
    const ibc = await tx.ibc.findUnique({ where: { id: ibcId }, select: ibcSelect });
    const pendente = ibc
      ? await tx.entradaPatioIbc.findFirst({ where: { ibcId, status: "PENDENTE" }, select: { id: true } })
      : null;
    const data = decidir(ibc ? toParaAbrir(ibc) : null, pendente != null);
    try {
      const entrada = await tx.entradaPatioIbc.create({
        data: {
          ibcId,
          origem: data.origem,
          status: "PENDENTE",
          abertoPorId: data.abertoPorId,
          abertoEm: data.abertoEm,
        },
      });
      const updated = await tx.ibc.update({
        where: { id: ibcId },
        data: { custodia: "ENTRADA", aptidao: "INAPTO", motivoInaptidao: data.motivoInaptidao },
        select: { identificador: true },
      });
      return {
        id: entrada.id,
        ibcId,
        identificador: updated.identificador,
        origem: data.origem,
        status: "PENDENTE",
        abertoEm: entrada.abertoEm,
        custodia: "ENTRADA",
        aptidao: "INAPTO",
        motivoInaptidao: data.motivoInaptidao,
      };
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError({
          message: "Este IBC já tem entrada no pátio pendente",
          statusCode: 409,
          code: "IBC_ENTRADA_JA_ABERTA",
          details: { id: ibcId },
        });
      }
      throw err;
    }
  }

  private async concluirNaTransacao(
    tx: Prisma.TransactionClient,
    ibcId: string,
    decidir: DecidirConclusaoEntrada,
  ): Promise<EntradaPatioConcluida> {
    await tx.$queryRaw`SELECT "id" FROM "Ibc" WHERE "id" = ${ibcId} FOR UPDATE`;
    const entrada = await tx.entradaPatioIbc.findFirst({
      where: { ibcId, status: "PENDENTE" },
      include: {
        ibc: { select: { identificador: true, baixadoEm: true, dataLimite: true, motivoInaptidao: true } },
        inspecoes: {
          orderBy: { inspecionadoEm: "desc" },
          select: { checklistModeloId: true, resultado: true, inspecionadoEm: true },
        },
      },
    });
    const vinculos = entrada
      ? await tx.ibcChecklistVinculo.findMany({
          where: { ibcId, checklistModelo: { ativo: true } },
          orderBy: { checklistModelo: { nome: "asc" } },
          select: { checklistModeloId: true, checklistModelo: { select: { nome: true } } },
        })
      : [];
    const data = decidir(entrada ? toParaConcluir(entrada, vinculos) : null);
    await tx.ibc.update({
      where: { id: ibcId },
      data: { custodia: "PATIO", aptidao: data.aptidao, motivoInaptidao: data.motivoInaptidao },
    });
    const updated = await tx.entradaPatioIbc.update({
      where: { id: data.entradaId },
      data: { status: "CONCLUIDA", concluidoPorId: data.concluidoPorId, concluidoEm: data.concluidoEm },
    });
    return {
      id: updated.id,
      ibcId,
      identificador: entrada?.ibc.identificador ?? "",
      custodia: "PATIO",
      aptidao: data.aptidao,
      motivoInaptidao: data.motivoInaptidao,
      concluidoEm: updated.concluidoEm ?? data.concluidoEm,
    };
  }
}

function toParaConcluir(
  entrada: {
    id: string;
    ibcId: string;
    ibc: { identificador: string; baixadoEm: Date | null; dataLimite: Date | null; motivoInaptidao: IbcRow["motivoInaptidao"] };
    inspecoes: InspecaoDaEntrada[];
  },
  vinculos: Array<{ checklistModeloId: string; checklistModelo: { nome: string } }>,
): EntradaParaConcluir {
  const checklistsAtivos: ChecklistDaEntrada[] = vinculos.map((vinculo) => ({
    checklistModeloId: vinculo.checklistModeloId,
    nome: vinculo.checklistModelo.nome,
  }));
  return {
    id: entrada.id,
    ibcId: entrada.ibcId,
    identificador: entrada.ibc.identificador,
    baixadoEm: entrada.ibc.baixadoEm,
    dataLimite: entrada.ibc.dataLimite,
    motivoInaptidao: entrada.ibc.motivoInaptidao,
    checklistsAtivos,
    inspecoes: entrada.inspecoes,
  };
}

function toParaAbrir(row: IbcRow): IbcParaAbrirEntrada {
  return {
    id: row.id,
    identificador: row.identificador,
    baixadoEm: row.baixadoEm,
    custodia: row.custodia,
    aptidao: row.aptidao,
    motivoInaptidao: row.motivoInaptidao,
    dataLimite: row.dataLimite,
    tipoCadastro: row.tipoCadastro,
    aquisicao: row.aquisicao,
  };
}
