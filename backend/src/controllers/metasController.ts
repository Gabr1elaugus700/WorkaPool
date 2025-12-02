// src/controllers/MetasController.ts
import { Request, Response } from "express";
import { MetasService } from "../services/metasService";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const metasController = {
  async createMetas(req: Request, res: Response): Promise<any> {
    const { codRep, mesMeta, anoMeta, metas } = req.body;

    // Validação básica
    if (
      !codRep ||
      !mesMeta ||
      !anoMeta ||
      !Array.isArray(metas) ||
      metas.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Dados incompletos ou metas vazio." });
    }

    // Validação dos itens do array metas
    const metasValidas = metas.every(
      (meta) =>
        meta.produto &&
        meta.cod_grp &&
        typeof meta.metaProduto === "number" &&
        !isNaN(meta.metaProduto)
    );

    if (!metasValidas) {
      return res.status(400).json({
        error: "Dados das metas incompletos ou metaProduto inválido.",
        detalhes: metas.map((meta, idx) => ({
          indice: idx,
          produto: meta.produto || "VAZIO",
          cod_grp: meta.cod_grp || "VAZIO",
          metaProduto: meta.metaProduto,
          valido: !!(
            meta.produto &&
            meta.cod_grp &&
            typeof meta.metaProduto === "number" &&
            !isNaN(meta.metaProduto)
          ),
        })),
      });
    }

    try {
      await MetasService.salvar({ codRep, mesMeta, anoMeta, metas });
      return res.status(200).json({ message: "Metas salvas com sucesso!" });
    } catch (err) {
      console.error("Erro ao salvar metas:", err);
      return res.status(500).json({ error: "Erro interno ao salvar metas." });
    }
  },

  async getMetas(req: Request, res: Response): Promise<any> {
    const { codRep, mesMeta, anoMeta } = req.query;
    // console.log("Parâmetros recebidos:", codRep, mesMeta, anoMeta);
    if (!codRep || !mesMeta || !anoMeta) {
      return res.status(400).json({ error: "Parâmetros ausentes." });
    }

    const metas = await prisma.metas.findMany({
      where: {
        codRep: Number(codRep),
        mesMeta: Number(mesMeta),
        anoMeta: Number(anoMeta),
      },
    });

    // console.log("Metas encontradas:", metas);
    return res.status(200).json(metas);
  },
};
