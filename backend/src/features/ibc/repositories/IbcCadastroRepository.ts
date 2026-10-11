import { Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import { AppError } from "../../../utils/AppError";
import { ibcJaSubstituidoError } from "../services/assertIbcNotReplaced";
import { formatIbcIdentifier } from "../services/formatIbcIdentifier";
import {
  CreateDerivedIbcData,
  CreateIbcLoteData,
  CreateNovoIbcData,
  IbcCadastroRecord,
  IbcConversionHistoryRecord,
  IbcLoteRecord,
  IbcMotivoInaptidao,
  IbcStructuralChangeType,
} from "../types/IbcCadastro.types";
import {
  IIbcCadastroRepository,
  ListIbcsOptions,
} from "./IIbcCadastroRepository";

type IbcRow = {
  id: string;
  identificador: string;
  prefixo?: string | null;
  sequencial?: number | null;
  tipoCadastro: "NOVO" | "TROCA";
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: IbcMotivoInaptidao | null;
  custodia: "PATIO" | "EM_VIAGEM";
  dataLimite: Date | null;
  primeiraInspecaoEm: Date | null;
  baixadoEm: Date | null;
  createdAt: Date;
  loteId?: string | null;
  produtoId?: string | null;
  convertedToContainerId?: string | null;
};

const STRUCTURAL_CHANGE_TYPES: readonly IbcStructuralChangeType[] = [
  "conversion",
  "product_change",
  "status_change",
];

function toStructuralChangeType(value: string): IbcStructuralChangeType {
  const match = STRUCTURAL_CHANGE_TYPES.find((type) => type === value);
  if (!match) {
    throw new Error(`Unknown IBC change type: ${value}`);
  }
  return match;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

export class IbcCadastroRepository implements IIbcCadastroRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prismaInstance) {
    this.prisma = prismaClient;
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

  async createNovoIbcs(
    data: CreateNovoIbcData,
    quantidade: number,
  ): Promise<IbcCadastroRecord[]> {
    return this.withUniqueGuard(data.prefixo, () =>
      this.prisma.$transaction(async (tx) => {
        const first = await this.reserveSequencial(tx, data.prefixo);
        const last = first + quantidade - 1;

        await tx.ibc.createMany({
          data: Array.from({ length: quantidade }, (_, index) => {
            const sequencial = first + index;
            return {
              identificador: formatIbcIdentifier(data.prefixo, sequencial),
              prefixo: data.prefixo,
              sequencial,
              tipoCadastro: data.tipoCadastro,
              aquisicao: "COMPRA" as const,
              aptidao: data.aptidao,
              motivoInaptidao: data.motivoInaptidao,
              custodia: data.custodia,
              dataLimite: data.dataLimite,
              primeiraInspecaoEm: data.primeiraInspecaoEm,
              loteId: data.loteId ?? null,
              produtoId: data.produtoId,
            };
          }),
        });

        const rows = await tx.ibc.findMany({
          where: {
            prefixo: data.prefixo,
            sequencial: { gte: first, lte: last },
          },
          orderBy: { sequencial: "asc" },
        });
        return rows.map((row) => this.toRecord(row));
      }),
    );
  }

  async createDerivedIbcFromSource(
    data: CreateDerivedIbcData,
  ): Promise<IbcCadastroRecord> {
    return this.withUniqueGuard(data.prefixo, () =>
      this.prisma.$transaction(async (tx) => {
        const source = await tx.ibc.findUnique({
          where: { id: data.sourceIbcId },
        });

        if (!source) {
          throw new AppError({
            message: "IBC não encontrado",
            statusCode: 404,
            code: "IBC_NOT_FOUND",
            details: { id: data.sourceIbcId },
          });
        }

        const sequencial = await this.reserveSequencial(tx, data.prefixo);
        const created = await tx.ibc.create({
          data: {
            identificador: formatIbcIdentifier(data.prefixo, sequencial),
            prefixo: data.prefixo,
            sequencial,
            aptidao: source.aptidao,
            custodia: source.custodia,
            tipoCadastro: source.tipoCadastro,
            aquisicao: source.aquisicao,
            motivoInaptidao: source.motivoInaptidao,
            dataLimite: source.dataLimite,
            primeiraInspecaoEm: source.primeiraInspecaoEm,
            produtoId: data.produtoId,
          },
        });

        const linked = await tx.ibc.updateMany({
          where: { id: source.id, convertedToContainerId: null },
          data: { convertedToContainerId: created.id },
        });
        if (linked.count === 0) {
          throw ibcJaSubstituidoError({ identificador: source.identificador });
        }
        await tx.ibcConversionHistory.create({
          data: {
            fromContainerId: source.id,
            toContainerId: created.id,
            changeType: data.changeType,
            actorId: data.actorId,
            observation: data.observation,
          },
        });

        return this.toRecord(created);
      }),
    );
  }

  async listConversionHistory(
    ibcId: string,
  ): Promise<IbcConversionHistoryRecord[]> {
    const rows = await this.prisma.ibcConversionHistory.findMany({
      where: {
        OR: [{ fromContainerId: ibcId }, { toContainerId: ibcId }],
      },
      orderBy: { createdAt: "asc" },
      include: {
        fromContainer: { select: { id: true, identificador: true } },
        toContainer: { select: { id: true, identificador: true } },
      },
    });

    const actorIds = [...new Set(rows.map((row) => row.actorId))];
    const actors = actorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, user: true },
        })
      : [];
    const actorNames = new Map(
      actors.map((actor) => [actor.id, actor.name || actor.user]),
    );

    return rows.map((row) => ({
      id: row.id,
      changeType: toStructuralChangeType(row.changeType),
      observation: row.observation,
      actorId: row.actorId,
      actorName: actorNames.get(row.actorId) ?? null,
      createdAt: row.createdAt,
      from: row.fromContainer,
      to: row.toContainer,
    }));
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

  /**
   * Serializa a alocação por prefixo (advisory lock liberado no fim da transação)
   * e devolve o próximo sequencial livre.
   */
  private async reserveSequencial(
    tx: Prisma.TransactionClient,
    prefixo: string,
  ): Promise<number> {
    await tx.$queryRaw`SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtext(${prefixo}))) AS lock`;
    const result = await tx.ibc.aggregate({
      where: { prefixo },
      _max: { sequencial: true },
    });
    return (result._max.sequencial ?? 0) + 1;
  }

  private async withUniqueGuard<T>(
    prefixo: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        throw new AppError({
          message: "Identificador de IBC já existe",
          statusCode: 409,
          code: "IBC_IDENTIFICADOR_DUPLICADO",
          details: { prefixo },
        });
      }
      throw err;
    }
  }

  private toRecord(row: IbcRow): IbcCadastroRecord {
    return {
      id: row.id,
      identificador: row.identificador,
      prefixo: row.prefixo ?? null,
      sequencial: row.sequencial ?? null,
      tipoCadastro: row.tipoCadastro,
      aptidao: row.aptidao,
      motivoInaptidao: row.motivoInaptidao,
      custodia: row.custodia,
      dataLimite: row.dataLimite,
      primeiraInspecaoEm: row.primeiraInspecaoEm,
      baixadoEm: row.baixadoEm,
      createdAt: row.createdAt,
      loteId: row.loteId ?? null,
      produtoId: row.produtoId ?? null,
      convertedToContainerId: row.convertedToContainerId ?? null,
    };
  }
}
