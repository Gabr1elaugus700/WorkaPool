import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const MetasRepository = {
  async apagarMetasAntigas(codRep: number, mesMeta: number, anoMeta: number) {
    return prisma.metas.deleteMany({
      where: { codRep, mesMeta, anoMeta },
    });
  },

  async salvarMetasEmLote(metas: {
    codRep: number;
    mesMeta: number;
    anoMeta: number;
    produto: string;
    metaProduto: number;
    precoMedio?: number;
    totalVendas?: number;
  }[]) {
    return prisma.metas.createMany({
      data: metas,
    });
  },
};