// src/controllers/MetasController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const pbiMetasController = async(req: Request, res: Response): Promise<any> => {
    try {
    const metas = await prisma.metas.findMany(); // ← nome correto do model: "metas"

    const resultado = metas.map((m) => ({
      codVendedor: m.codRep,
      grupoProduto: m.produto,
      mes: m.mesMeta,
      ano: m.anoMeta,
      metaProduto: m.metaProduto,
      precoMedio: m.precoMedio,
      totalVendas: m.totalVendas,
      criadoEm: m.createdAt,
    }));

    res.json(resultado);
  } catch (err) {
    console.error("Erro ao exportar metas:", err);
    res.status(500).json({ erro: "Erro ao exportar metas" });
  }
};