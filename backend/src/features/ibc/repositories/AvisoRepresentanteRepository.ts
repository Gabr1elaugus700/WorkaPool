import { AvisoRepresentanteIbc, Prisma, PrismaClient } from "@prisma/client";
import prismaInstance from "../../../config/prisma";
import {
  AvisoAgrupado,
  ItemAvisoRepresentante,
} from "../services/agruparFicaramEmAvisos";

export type NovoAvisoRepresentante = AvisoAgrupado & {
  expedicaoIbcId: string;
  codCar: number;
  codRep: number;
};

export type AvisoRepresentanteRecord = NovoAvisoRepresentante & {
  id: string;
  lidoEm: Date | null;
  createdAt: Date;
};

export type FiltroAvisosRepresentante =
  | { escopo: "codRep"; codRep: number }
  | { escopo: "todas" };

type Db = PrismaClient | Prisma.TransactionClient;

export type ContextoAvisoRepresentante = {
  pedidos: unknown;
  vencimentoPorIbcId: ReadonlyMap<string, string | null>;
};

export type TransacaoAvisoRepresentante = {
  carregarContexto(
    expedicaoIbcId: string,
    ibcIdsEmprestimo: readonly string[],
  ): Promise<ContextoAvisoRepresentante | null>;
  inserirAvisos(avisos: readonly NovoAvisoRepresentante[]): Promise<number>;
  marcarProcessado(consumerName: string, eventId: string): Promise<void>;
};

export class AvisoRepresentanteRepository {
  constructor(private readonly prisma: PrismaClient = prismaInstance) {}

  async executarEmTransacao<T>(
    trabalho: (tx: TransacaoAvisoRepresentante) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((db) =>
      trabalho({
        carregarContexto: (expedicaoIbcId, ibcIdsEmprestimo) =>
          carregarContexto(db, expedicaoIbcId, ibcIdsEmprestimo),
        inserirAvisos: (avisos) => this.inserirIdempotente(avisos, db),
        marcarProcessado: (consumerName, eventId) =>
          marcarAvisoProcessado(db, consumerName, eventId),
      }),
    );
  }

  async inserirIdempotente(
    avisos: readonly NovoAvisoRepresentante[],
    db: Db = this.prisma,
  ): Promise<number> {
    if (avisos.length === 0) return 0;
    const result = await db.avisoRepresentanteIbc.createMany({
      data: avisos.map(toCreateInput),
      skipDuplicates: true,
    });
    return result.count;
  }

  async listar(filtro: FiltroAvisosRepresentante): Promise<AvisoRepresentanteRecord[]> {
    const rows = await this.prisma.avisoRepresentanteIbc.findMany({
      where: filtro.escopo === "codRep" ? { codRep: filtro.codRep } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toRecord);
  }

  async buscarPorId(id: string): Promise<AvisoRepresentanteRecord | null> {
    const row = await this.prisma.avisoRepresentanteIbc.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async marcarLido(id: string, lidoEm: Date): Promise<AvisoRepresentanteRecord | null> {
    await this.prisma.avisoRepresentanteIbc.updateMany({
      where: { id, lidoEm: null },
      data: { lidoEm },
    });
    const row = await this.prisma.avisoRepresentanteIbc.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }
}

export type AvisoLeituraPort = Pick<AvisoRepresentanteRepository, "listar" | "buscarPorId" | "marcarLido">;

function toCreateInput(aviso: NovoAvisoRepresentante): Prisma.AvisoRepresentanteIbcCreateManyInput {
  return {
    expedicaoIbcId: aviso.expedicaoIbcId,
    codCar: aviso.codCar,
    numPed: aviso.numPed,
    codCli: aviso.codCli,
    cliente: aviso.cliente,
    codRep: aviso.codRep,
    itens: aviso.itens.map(toJsonItem),
  };
}

function toJsonItem(item: ItemAvisoRepresentante): Prisma.InputJsonObject {
  return {
    ibcId: item.ibcId,
    identificador: item.identificador,
    modalidade: item.modalidade,
    emprestimoVenceEm: item.emprestimoVenceEm,
  };
}

function toRecord(row: AvisoRepresentanteIbc): AvisoRepresentanteRecord {
  return { ...row, itens: parseItens(row.itens) };
}

function parseItens(value: Prisma.JsonValue): ItemAvisoRepresentante[] {
  if (!Array.isArray(value)) {
    throw new Error("AvisoRepresentanteIbc.itens não é uma lista");
  }
  return value.map((item) => {
    if (!isItem(item)) {
      throw new Error("AvisoRepresentanteIbc.itens contém item inválido");
    }
    return {
      ibcId: item.ibcId,
      identificador: item.identificador,
      modalidade: item.modalidade,
      emprestimoVenceEm: item.emprestimoVenceEm,
    };
  });
}

async function carregarContexto(
  db: Db,
  expedicaoIbcId: string,
  ibcIdsEmprestimo: readonly string[],
): Promise<ContextoAvisoRepresentante | null> {
  const expedicao = await db.expedicaoIbc.findUnique({
    where: { id: expedicaoIbcId },
    select: { cargaId: true },
  });
  if (!expedicao) return null;

  const fechada = await db.cargasFechadas.findFirst({
    where: { cargaId: expedicao.cargaId },
    orderBy: { createdAt: "desc" },
    select: { pedidos: true },
  });

  const vencimentoPorIbcId = new Map<string, string | null>();
  if (ibcIdsEmprestimo.length > 0) {
    const alocacoes = await db.alocacaoIbc.findMany({
      where: { expedicaoIbcId, ibcId: { in: [...ibcIdsEmprestimo] } },
      select: { ibcId: true, emprestimoVenceEm: true },
    });
    for (const alocacao of alocacoes) {
      const iso = alocacao.emprestimoVenceEm?.toISOString() ?? null;
      const atual = vencimentoPorIbcId.get(alocacao.ibcId);
      if (atual === undefined || (atual === null && iso !== null)) {
        vencimentoPorIbcId.set(alocacao.ibcId, iso);
      }
    }
  }

  return { pedidos: fechada?.pedidos ?? [], vencimentoPorIbcId };
}

async function marcarAvisoProcessado(
  db: Db,
  consumerName: string,
  eventId: string,
): Promise<void> {
  await db.processedEvent.create({ data: { consumerName, eventId } });
}

function isItem(value: Prisma.JsonValue): value is Prisma.JsonObject & ItemAvisoRepresentante {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const modalidade = value.modalidade;
  const venceEm = value.emprestimoVenceEm;
  return (
    typeof value.ibcId === "string" &&
    typeof value.identificador === "string" &&
    (modalidade === "VENDA" || modalidade === "EMPRESTIMO") &&
    (venceEm === null || typeof venceEm === "string")
  );
}
