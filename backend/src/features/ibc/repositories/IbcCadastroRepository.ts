import { PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import {
  CreateIbcLoteData,
  CreateNovoIbcData,
  IbcCadastroRecord,
  IbcLoteRecord,
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
  loteId?: string | null;
  produtoId?: string | null;
  convertedToContainerId?: string | null;
};

export class IbcCadastroRepository implements IIbcCadastroRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
  }

  async findHighestIdentificadorByPrefix(prefix: string): Promise<string | null> {
    const row = await this.prisma.ibc.findFirst({
      where: { identificador: { startsWith: prefix } },
      orderBy: { identificador: "desc" },
      select: { identificador: true },
    });
    return row?.identificador ?? null;
  }

  async createIbcLote(data: CreateIbcLoteData): Promise<IbcLoteRecord> {
    const created = await this.prisma.ibcLote.create({
      data: {
        numeroNf: data.numeroNf,
        dataLimite: data.dataLimite,
      },
    });
    return {
      id: created.id,
      numeroNf: created.numeroNf,
      dataLimite: created.dataLimite,
      createdAt: created.createdAt,
    };
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
        loteId: data.loteId ?? undefined,
        produtoId: data.produtoId,
      },
    });
    return this.toRecord(created);
  }

  async createDerivedIbcFromSource(data: {
    sourceIbcId: string;
    identificador: string;
    produtoId: string | null;
    actorId: string;
    observation: string | null;
    changeType: "conversion" | "product_change" | "status_change";
  }): Promise<IbcCadastroRecord> {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.ibc.findUnique({
        where: { id: data.sourceIbcId },
      });

      if (!source) {
        throw new Error(`IBC source not found: ${data.sourceIbcId}`);
      }

      const created = await tx.ibc.create({
        data: {
          identificador: data.identificador,
          aptidao: source.aptidao,
          custodia: source.custodia,
          tipoCadastro: source.tipoCadastro,
          aquisicao: source.aquisicao,
          motivoInaptidao: source.motivoInaptidao,
          dataLimite: source.dataLimite,
          produtoId: data.produtoId,
        },
      });

      await tx.$executeRawUnsafe(
        `UPDATE "Ibc" SET "convertedToContainerId" = $1 WHERE "id" = $2`,
        created.id,
        source.id,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO "IbcConversionHistory" ("id","fromContainerId","toContainerId","changeType","actorId","observation","createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)`,
        crypto.randomUUID(),
        source.id,
        created.id,
        data.changeType,
        data.actorId,
        data.observation,
      );

      return this.toRecord(created);
    });
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

  async countVivosWp(): Promise<number> {
    return this.prisma.ibc.count({
      where: { baixadoEm: null },
    });
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
      loteId: row.loteId ?? null,
      produtoId: row.produtoId ?? null,
      convertedToContainerId: row.convertedToContainerId ?? null,
    };
  }
}
