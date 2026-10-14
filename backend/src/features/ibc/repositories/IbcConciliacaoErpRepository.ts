import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import {
  IIbcConciliacaoErpRepository,
  IbcLinhaConciliacaoErp,
} from "./IIbcConciliacaoErpRepository";

/**
 * Leitura pura de todo IBC. Não filtra ENTRADA e não chama `markDataLimite`.
 * A alocação aberta mais recente casa o pedido da mesma carga.
 */
const linhaSelect = {
  id: true,
  identificador: true,
  custodia: true,
  motivoBaixa: true,
  aquisicao: true,
  baixadoEm: true,
  convertedToContainerId: true,
  loteId: true,
  lote: { select: { numeroNf: true } },
  trocaEntrada: { select: { identificador: true } },
  trocaSaida: { select: { identificador: true } },
  alocacoes: {
    where: { encerradaEm: null },
    orderBy: { alocadoEm: "desc" },
    take: 1,
    select: {
      numPed: true,
      emprestimoVenceEm: true,
      carga: {
        select: {
          pedidosIbc: {
            select: { numPed: true, codCli: true, cliente: true },
          },
        },
      },
    },
  },
} satisfies Prisma.IbcSelect;

type LinhaRow = Prisma.IbcGetPayload<{ select: typeof linhaSelect }>;

export class IbcConciliacaoErpRepository implements IIbcConciliacaoErpRepository {
  constructor(private readonly prisma: PrismaClient = prismaInstance) {}

  async listLinhas(): Promise<IbcLinhaConciliacaoErp[]> {
    const rows = await this.prisma.ibc.findMany({
      select: linhaSelect,
      orderBy: { identificador: "asc" },
    });
    return rows.map(toLinha);
  }
}

function toLinha(row: LinhaRow): IbcLinhaConciliacaoErp {
  const alocacao = row.alocacoes[0];
  const pedido = alocacao?.carga.pedidosIbc.find((item) => item.numPed === alocacao.numPed);
  return {
    id: row.id,
    identificador: row.identificador,
    custodia: row.custodia,
    motivoBaixa: row.motivoBaixa,
    aquisicao: row.aquisicao,
    baixadoEm: row.baixadoEm,
    convertedToContainerId: row.convertedToContainerId,
    loteId: row.loteId,
    numeroNf: row.lote?.numeroNf ?? null,
    trocaEntradaIdentificador: row.trocaEntrada?.identificador ?? null,
    trocaSaidaIdentificador: row.trocaSaida?.identificador ?? null,
    cliente: pedido?.cliente ?? null,
    codCli: pedido?.codCli ?? null,
    numPed: alocacao?.numPed ?? null,
    emprestimoVenceEm: alocacao?.emprestimoVenceEm ?? null,
  };
}
