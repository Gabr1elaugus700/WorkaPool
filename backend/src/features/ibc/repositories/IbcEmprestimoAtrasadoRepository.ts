import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { resolverCodRepPedidoFechado } from "../services/resolverCodRepPedidoFechado";
import type { LinhaEmprestimoAtrasado } from "../types/EmprestimoAtrasado.types";
import type { IIbcEmprestimoAtrasadoRepository } from "./IIbcEmprestimoAtrasadoRepository";

/**
 * Leitura do empréstimo ainda aberto. A alocação escolhida é a aberta mais
 * recente com prazo gravado. O SQL exige alguma aberta já vencida; a
 * projeção descarta a linha se a escolhida ainda não venceu.
 */
const linhaSelect = {
  id: true,
  identificador: true,
  custodia: true,
  motivoBaixa: true,
  baixadoEm: true,
  convertedToContainerId: true,
  alocacoes: {
    where: { encerradaEm: null, emprestimoVenceEm: { not: null } },
    orderBy: { alocadoEm: "desc" },
    take: 1,
    select: {
      numPed: true,
      emprestimoVenceEm: true,
      encerradaEm: true,
      carga: {
        select: {
          codCar: true,
          pedidosIbc: { select: { numPed: true, codCli: true, cliente: true } },
          CargasFechadas: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { pedidos: true },
          },
        },
      },
    },
  },
} satisfies Prisma.IbcSelect;

type LinhaRow = Prisma.IbcGetPayload<{ select: typeof linhaSelect }>;

export class IbcEmprestimoAtrasadoRepository implements IIbcEmprestimoAtrasadoRepository {
  constructor(private readonly prisma: PrismaClient = prismaInstance) {}

  async listar(now: Date): Promise<LinhaEmprestimoAtrasado[]> {
    const rows = await this.prisma.ibc.findMany({
      where: {
        custodia: "CLIENTE",
        motivoBaixa: null,
        baixadoEm: null,
        convertedToContainerId: null,
        alocacoes: {
          some: { encerradaEm: null, emprestimoVenceEm: { lt: now } },
        },
      },
      select: linhaSelect,
    });

    const linhas: LinhaEmprestimoAtrasado[] = [];
    for (const row of rows) {
      const linha = toLinha(row, now);
      if (linha) linhas.push(linha);
    }
    return linhas;
  }
}

function toLinha(row: LinhaRow, now: Date): LinhaEmprestimoAtrasado | null {
  const alocacao = row.alocacoes[0];
  const venceEm = alocacao?.emprestimoVenceEm;
  if (!alocacao || venceEm == null || venceEm.getTime() >= now.getTime()) return null;

  const pedido = alocacao.carga.pedidosIbc.find((item) => item.numPed === alocacao.numPed);
  const fechada = alocacao.carga.CargasFechadas[0];
  return {
    id: row.id,
    identificador: row.identificador,
    cliente: pedido?.cliente ?? null,
    codCli: pedido?.codCli ?? null,
    numPed: alocacao.numPed,
    codCar: alocacao.carga.codCar,
    codRep: resolverCodRepPedidoFechado(fechada?.pedidos, alocacao.numPed),
    emprestimoVenceEm: venceEm,
    custodia: row.custodia,
    motivoBaixa: row.motivoBaixa,
    baixadoEm: row.baixadoEm,
    convertedToContainerId: row.convertedToContainerId,
    alocacaoEncerradaEm: alocacao.encerradaEm,
  };
}
