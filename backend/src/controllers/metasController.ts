// src/controllers/MetasController.ts
import { Request, Response } from "express";
import { MetasService } from "../services/metasService";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const metasController = {

    async createMetas(req: Request, res: Response): Promise<any> {

        const { codRep, mesMeta, anoMeta, metas } = req.body;

        if (!codRep || !mesMeta || !anoMeta || !Array.isArray(metas)) {
            return res.status(400).json({ error: "Dados incompletos." });
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
        console.log("Parâmetros recebidos:", codRep, mesMeta, anoMeta);
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

        return res.status(200).json(metas);
    }}
