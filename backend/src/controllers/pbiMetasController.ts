import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 👉 GET: Exportar todas as metas
export const pbiMetasController = async (req: Request, res: Response): Promise<any> => {
  try {
    const metas = await prisma.metas.findMany();

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

// 👉 POST: Salvar uma única meta simples
export const salvarMetaSimples = async (req: Request, res: Response): Promise<any> => {
  const { codRep, mesMeta, anoMeta, produto, metaProduto, precoMedio, totalVendas } = req.body;

  if (
    !codRep ||
    !mesMeta ||
    !anoMeta ||
    !produto ||
    metaProduto == null ||
    precoMedio == null ||
    totalVendas == null
  ) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  try {
    const novaMeta = await prisma.metas.create({
      data: {
        codRep,
        mesMeta,
        anoMeta,
        produto,
        metaProduto,
        precoMedio,
        totalVendas,
      },
    });

    res.status(201).json({ message: "Meta salva com sucesso!", meta: novaMeta });
  } catch (err) {
    console.error("Erro ao salvar meta simples:", err);
    res.status(500).json({ error: "Erro interno ao salvar meta." });
  }
};
