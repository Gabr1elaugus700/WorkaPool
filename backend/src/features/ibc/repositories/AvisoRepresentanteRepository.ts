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

export class AvisoRepresentanteRepository {
  constructor(private readonly prisma: PrismaClient = prismaInstance) {}

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

  async marcarLido(id: string, lidoEm: Date): Promise<AvisoRepresentanteRecord | null> {
    await this.prisma.avisoRepresentanteIbc.updateMany({
      where: { id, lidoEm: null },
      data: { lidoEm },
    });
    const row = await this.prisma.avisoRepresentanteIbc.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }
}

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
