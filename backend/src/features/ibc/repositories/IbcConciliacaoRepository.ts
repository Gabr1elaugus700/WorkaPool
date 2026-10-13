import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { AppError } from "../../../utils/AppError";
import { EfeitoFechamentoIbc, FicouNaViagem } from "../services/planejarFechamentoViagem";
import {
  DestinoConciliacaoIbc,
  ModalidadeConciliacaoIbc,
} from "../services/conciliacaoViagem";

export type MarcaConciliacaoSalva = {
  alocacaoIbcId: string;
  destino: DestinoConciliacaoIbc;
  modalidade: ModalidadeConciliacaoIbc | null;
  ibcEntradaId: string | null;
};

export type RetornoSemIdSalvo = {
  chaveCliente: string;
  quantidadePapel: number;
  confirmouDivergencia: boolean;
};

export type ExpedicaoParaConciliar = {
  id: string;
  viagemFechadaEm: Date | null;
  viagemFechadaPorId: string | null;
};

export type SalvarConciliacaoData = {
  expedicaoIbcId: string;
  lancadoPorId: string;
  marcas: Array<{
    alocacaoIbcId: string;
    destino: DestinoConciliacaoIbc;
    modalidade: ModalidadeConciliacaoIbc | null;
  }>;
  retornos: Array<{
    chaveCliente: string;
    quantidadePapel: number;
    confirmouDivergencia: boolean;
  }>;
};

export interface IIbcConciliacaoRepository {
  findPorCarga(cargaId: string): Promise<ExpedicaoParaConciliar | null>;
  listMarcas(expedicaoIbcId: string): Promise<MarcaConciliacaoSalva[]>;
  listRetornos(expedicaoIbcId: string): Promise<RetornoSemIdSalvo[]>;
  save(data: SalvarConciliacaoData): Promise<void>;
  vincularEntradaTroca(alocacaoIbcId: string, ibcEntradaId: string): Promise<boolean>;
  fecharViagem(
    cmd: FecharViagemComando,
    abrirEntradas: (tx: Prisma.TransactionClient) => Promise<void>,
  ): Promise<void>;
}

export type FecharViagemComando = {
  expedicaoId: string;
  actorId: string;
  now: Date;
  codCar: number;
  efeitos: EfeitoFechamentoIbc[];
  ficaram: FicouNaViagem[];
};

export class IbcConciliacaoRepository implements IIbcConciliacaoRepository {
  constructor(private readonly prisma: PrismaClient = prismaInstance) {}

  async findPorCarga(cargaId: string): Promise<ExpedicaoParaConciliar | null> {
    const row = await this.prisma.expedicaoIbc.findUnique({ where: { cargaId } });
    if (!row) return null;
    return {
      id: row.id,
      viagemFechadaEm: row.viagemFechadaEm,
      viagemFechadaPorId: row.viagemFechadaPorId,
    };
  }

  async listMarcas(expedicaoIbcId: string): Promise<MarcaConciliacaoSalva[]> {
    const rows = await this.prisma.conciliacaoViagemIbc.findMany({ where: { expedicaoIbcId } });
    return rows.map((row) => ({
      alocacaoIbcId: row.alocacaoIbcId,
      destino: row.destino,
      modalidade: row.modalidade,
      ibcEntradaId: row.ibcEntradaId,
    }));
  }

  async listRetornos(expedicaoIbcId: string): Promise<RetornoSemIdSalvo[]> {
    const rows = await this.prisma.conciliacaoRetornoSemId.findMany({ where: { expedicaoIbcId } });
    return rows.map((row) => ({
      chaveCliente: row.chaveCliente,
      quantidadePapel: row.quantidadePapel,
      confirmouDivergencia: row.confirmouDivergencia,
    }));
  }

  async vincularEntradaTroca(alocacaoIbcId: string, ibcEntradaId: string): Promise<boolean> {
    const updated = await this.prisma.conciliacaoViagemIbc.updateMany({
      where: { alocacaoIbcId, destino: "TROCA", ibcEntradaId: null },
      data: { ibcEntradaId },
    });
    return updated.count === 1;
  }

  async save(data: SalvarConciliacaoData): Promise<void> {
    if (data.marcas.length === 0 && data.retornos.length === 0) return;
    await this.prisma.$transaction([
      ...data.marcas.map((marca) =>
        this.prisma.conciliacaoViagemIbc.upsert({
          where: { alocacaoIbcId: marca.alocacaoIbcId },
          create: {
            expedicaoIbcId: data.expedicaoIbcId,
            alocacaoIbcId: marca.alocacaoIbcId,
            destino: marca.destino,
            modalidade: marca.modalidade,
            lancadoPorId: data.lancadoPorId,
          },
          update: { destino: marca.destino, modalidade: marca.modalidade, lancadoPorId: data.lancadoPorId },
        }),
      ),
      ...data.retornos.map((retorno) =>
        this.prisma.conciliacaoRetornoSemId.upsert({
          where: {
            expedicaoIbcId_chaveCliente: {
              expedicaoIbcId: data.expedicaoIbcId,
              chaveCliente: retorno.chaveCliente,
            },
          },
          create: {
            expedicaoIbcId: data.expedicaoIbcId,
            chaveCliente: retorno.chaveCliente,
            quantidadePapel: retorno.quantidadePapel,
            confirmouDivergencia: retorno.confirmouDivergencia,
            lancadoPorId: data.lancadoPorId,
          },
          update: {
            quantidadePapel: retorno.quantidadePapel,
            confirmouDivergencia: retorno.confirmouDivergencia,
            lancadoPorId: data.lancadoPorId,
          },
        }),
      ),
    ]);
  }

  async fecharViagem(
    cmd: FecharViagemComando,
    abrirEntradas: (tx: Prisma.TransactionClient) => Promise<void>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.expedicaoIbc.updateMany({
        where: { id: cmd.expedicaoId, viagemFechadaEm: null },
        data: { viagemFechadaPorId: cmd.actorId, viagemFechadaEm: cmd.now },
      });
      if (locked.count !== 1) {
        throw new AppError({ message: "A viagem já foi fechada", statusCode: 409, code: "IBC_VIAGEM_JA_FECHADA", details: { expedicaoId: cmd.expedicaoId } });
      }
      await abrirEntradas(tx);
      for (const efeito of cmd.efeitos) {
        if (efeito.custodia || efeito.motivoBaixa || efeito.trocaEntradaId) {
          await tx.ibc.update({
            where: { id: efeito.ibcId },
            data: {
              ...(efeito.custodia ? { custodia: efeito.custodia } : {}),
              ...(efeito.motivoBaixa ? { motivoBaixa: efeito.motivoBaixa, baixaViagemEm: cmd.now } : {}),
              ...(efeito.trocaEntradaId ? { trocaEntradaId: efeito.trocaEntradaId } : {}),
            },
          });
        }
        if (efeito.encerrarAlocacao || efeito.emprestimoIniciadoEm) {
          await tx.alocacaoIbc.update({
            where: { id: efeito.alocacaoIbcId },
            data: efeito.encerrarAlocacao
              ? { encerradaEm: cmd.now }
              : { emprestimoIniciadoEm: efeito.emprestimoIniciadoEm, emprestimoVenceEm: efeito.emprestimoVenceEm },
          });
        }
      }
      await tx.outboxEvent.create({
        data: {
          id: randomUUID(),
          eventType: "ViagemIbcFechada",
          aggregateType: "ExpedicaoIbc",
          aggregateId: cmd.expedicaoId,
          occurredAt: cmd.now,
          payload: {
            expedicaoIbcId: cmd.expedicaoId,
            codCar: cmd.codCar,
            fechadaPorId: cmd.actorId,
            fechadaEm: cmd.now.toISOString(),
            ficaram: cmd.ficaram,
          },
        },
      });
    });
  }
}
