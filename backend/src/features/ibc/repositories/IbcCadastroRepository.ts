import { PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import {
  CreateNovoIbcData,
  IbcCadastroRecord,
} from "../types/IbcCadastro.types";
import {
  IIbcCadastroRepository,
  ListIbcsOptions,
} from "./IIbcCadastroRepository";

type IbcRow = {
  id: string;
  identificador: string;
  tipoCadastro: "NOVO" | "TROCA";
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: "AGUARDANDO_INSPECAO" | "DATA_LIMITE" | null;
  custodia: "PATIO" | "EM_VIAGEM";
  dataLimite: Date | null;
  baixadoEm: Date | null;
  createdAt: Date;
};

export class IbcCadastroRepository implements IIbcCadastroRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async findHighestIdentificador(): Promise<string | null> {
    const row = await this.prisma.ibc.findFirst({
      where: { identificador: { startsWith: "HM" } },
      orderBy: { identificador: "desc" },
      select: { identificador: true },
    });
    return row?.identificador ?? null;
  }

  async createNovoIbc(data: CreateNovoIbcData): Promise<IbcCadastroRecord> {
    const created = await this.prisma.ibc.create({
      data: {
        identificador: data.identificador,
        tipoCadastro: data.tipoCadastro,
        aquisicao: "COMPRA",
        aptidao: data.aptidao,
        motivoInaptidao: data.motivoInaptidao,
        custodia: data.custodia,
        dataLimite: data.dataLimite,
      },
    });
    return this.toRecord(created);
  }

  async listActiveIbcs(): Promise<IbcCadastroRecord[]> {
    const rows = await this.prisma.ibc.findMany({
      where: { baixadoEm: null },
      orderBy: { identificador: "asc" },
    });
    return rows.map((row) => this.toRecord(row));
  }

  async listIbcs(options: ListIbcsOptions): Promise<IbcCadastroRecord[]> {
    const rows = await this.prisma.ibc.findMany({
      where: options.incluirBaixados ? undefined : { baixadoEm: null },
      orderBy: { identificador: "asc" },
    });
    return rows.map((row) => this.toRecord(row));
  }

  async markDataLimite(ibcId: string): Promise<IbcCadastroRecord> {
    const updated = await this.prisma.ibc.update({
      where: { id: ibcId },
      data: {
        aptidao: "INAPTO",
        motivoInaptidao: "DATA_LIMITE",
      },
    });
    return this.toRecord(updated);
  }

  async findById(id: string): Promise<IbcCadastroRecord | null> {
    const row = await this.prisma.ibc.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async updateDataLimite(
    id: string,
    dataLimite: Date,
  ): Promise<IbcCadastroRecord> {
    const updated = await this.prisma.ibc.update({
      where: { id },
      data: { dataLimite },
    });
    return this.toRecord(updated);
  }

  async hasOpenAlocacao(ibcId: string): Promise<boolean> {
    const alocacao = await this.prisma.alocacaoIbc.findUnique({
      where: { ibcId },
      select: { id: true },
    });
    return alocacao != null;
  }

  async softDelete(id: string): Promise<IbcCadastroRecord> {
    const updated = await this.prisma.ibc.update({
      where: { id },
      data: { baixadoEm: new Date() },
    });
    return this.toRecord(updated);
  }

  private toRecord(row: IbcRow): IbcCadastroRecord {
    return {
      id: row.id,
      identificador: row.identificador,
      tipoCadastro: row.tipoCadastro,
      aptidao: row.aptidao,
      motivoInaptidao: row.motivoInaptidao,
      custodia: row.custodia,
      dataLimite: row.dataLimite,
      baixadoEm: row.baixadoEm,
      createdAt: row.createdAt,
    };
  }
}
