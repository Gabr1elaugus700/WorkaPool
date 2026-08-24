import { PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { PedidoCargo } from "../../pedidos/types/PedidoCargo.types";
import { IIbcExpedicaoRepository } from "./IIbcExpedicaoRepository";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  CreateAlocacaoIbcData,
  ExpedicaoIbcRecord,
  FecharExpedicaoIbcData,
  IbcRecord,
} from "../types/IbcExpedicao.types";

type AlocacaoRow = {
  id: string;
  ibcId: string;
  cargaId: string;
  numPed: string;
  alocadoPorId: string;
  alocadoEm: Date;
  expedicaoIbcId: string | null;
  ibc?: { identificador: string };
};

export class IbcExpedicaoRepository implements IIbcExpedicaoRepository {
  constructor(
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
    private readonly prisma: PrismaClient = prismaInstance,
  ) {}

  async getCargaByCodCar(codCar: number): Promise<CargaExpedicaoRef | null> {
    const carga = await this.prisma.cargas.findUnique({
      where: { codCar },
    });
    if (!carga) {
      return null;
    }
    return this.toCargaRef(carga);
  }

  async listCargasAbertaOuFechada(): Promise<CargaExpedicaoRef[]> {
    const cargas = await this.prisma.cargas.findMany({
      where: {
        situacao: { in: ["ABERTA", "FECHADA"] },
      },
      orderBy: { previsaoSaida: "asc" },
    });
    return cargas.map((carga) => this.toCargaRef(carga));
  }

  async getPedidosByCarga(codCar: number): Promise<PedidoCargo[]> {
    return this.pedidosRepository.getPedidosByCarga(codCar);
  }

  async findIbcByIdentificador(
    identificador: string,
  ): Promise<IbcRecord | null> {
    const ibc = await this.prisma.ibc.findUnique({
      where: { identificador },
    });
    if (!ibc) {
      return null;
    }
    return {
      id: ibc.id,
      identificador: ibc.identificador,
      aptidao: ibc.aptidao,
      custodia: ibc.custodia,
      createdAt: ibc.createdAt,
    };
  }

  async findAlocacaoByIbcId(
    ibcId: string,
  ): Promise<AlocacaoIbcRecord | null> {
    const alocacao = await this.prisma.alocacaoIbc.findUnique({
      where: { ibcId },
      include: { ibc: { select: { identificador: true } } },
    });
    if (!alocacao) {
      return null;
    }
    return this.toAlocacaoRecord(alocacao);
  }

  async findAlocacaoById(id: string): Promise<AlocacaoIbcRecord | null> {
    const alocacao = await this.prisma.alocacaoIbc.findUnique({
      where: { id },
      include: { ibc: { select: { identificador: true } } },
    });
    if (!alocacao) {
      return null;
    }
    return this.toAlocacaoRecord(alocacao);
  }

  async countAlocacoesByCargaAndNumPed(
    cargaId: string,
    numPed: string,
  ): Promise<number> {
    return this.prisma.alocacaoIbc.count({
      where: { cargaId, numPed },
    });
  }

  async listAlocacoesByCargaId(
    cargaId: string,
  ): Promise<AlocacaoIbcRecord[]> {
    const alocacoes = await this.prisma.alocacaoIbc.findMany({
      where: { cargaId },
      include: { ibc: { select: { identificador: true } } },
      orderBy: { alocadoEm: "asc" },
    });
    return alocacoes.map((row) => this.toAlocacaoRecord(row));
  }

  async findExpedicaoByCargaId(
    cargaId: string,
  ): Promise<ExpedicaoIbcRecord | null> {
    const expedicao = await this.prisma.expedicaoIbc.findUnique({
      where: { cargaId },
    });
    if (!expedicao) {
      return null;
    }
    return {
      id: expedicao.id,
      cargaId: expedicao.cargaId,
      fechadoPorId: expedicao.fechadoPorId,
      fechadoEm: expedicao.fechadoEm,
    };
  }

  async createAlocacao(
    data: CreateAlocacaoIbcData,
  ): Promise<AlocacaoIbcRecord> {
    const alocacao = await this.prisma.alocacaoIbc.create({
      data: {
        ibcId: data.ibcId,
        cargaId: data.cargaId,
        numPed: data.numPed,
        alocadoPorId: data.alocadoPorId,
      },
      include: { ibc: { select: { identificador: true } } },
    });
    return this.toAlocacaoRecord(alocacao);
  }

  async deleteAlocacao(id: string): Promise<void> {
    await this.prisma.alocacaoIbc.delete({ where: { id } });
  }

  async fecharExpedicao(
    data: FecharExpedicaoIbcData,
  ): Promise<ExpedicaoIbcRecord> {
    return this.prisma.$transaction(async (tx) => {
      const expedicao = await tx.expedicaoIbc.create({
        data: {
          cargaId: data.cargaId,
          fechadoPorId: data.fechadoPorId,
        },
      });

      if (data.alocacaoIds.length > 0) {
        await tx.alocacaoIbc.updateMany({
          where: { id: { in: data.alocacaoIds } },
          data: { expedicaoIbcId: expedicao.id },
        });
      }

      if (data.ibcIds.length > 0) {
        await tx.ibc.updateMany({
          where: { id: { in: data.ibcIds } },
          data: { custodia: "EM_VIAGEM" },
        });
      }

      return {
        id: expedicao.id,
        cargaId: expedicao.cargaId,
        fechadoPorId: expedicao.fechadoPorId,
        fechadoEm: expedicao.fechadoEm,
      };
    });
  }

  private toCargaRef(carga: {
    id: string;
    codCar: number;
    destino: string;
    situacao: string;
    previsaoSaida: Date;
  }): CargaExpedicaoRef {
    return {
      id: carga.id,
      codCar: carga.codCar,
      destino: carga.destino,
      situacao: carga.situacao,
      previsaoSaida: carga.previsaoSaida,
    };
  }

  private toAlocacaoRecord(row: AlocacaoRow): AlocacaoIbcRecord {
    return {
      id: row.id,
      ibcId: row.ibcId,
      cargaId: row.cargaId,
      numPed: row.numPed,
      alocadoPorId: row.alocadoPorId,
      alocadoEm: row.alocadoEm,
      expedicaoIbcId: row.expedicaoIbcId,
      identificador: row.ibc?.identificador ?? "",
    };
  }
}
