import { PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
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
}

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
}
