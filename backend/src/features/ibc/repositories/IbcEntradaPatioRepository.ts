import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { AppError } from "../../../utils/AppError";
import {
  DecidirAberturaEntrada,
  EntradaPatioAberta,
  IbcParaAbrirEntrada,
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
