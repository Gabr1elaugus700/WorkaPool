import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const cadastroCaminhaoController = {
    create: async (req: Request, res: Response): Promise<any> => {
        const { modelo, eixos, eixos_carregado, eixos_vazio, pneus, capacidade_kg, consumo_medio_km_l } = req.body;

        try {
            const novoCaminhao = await prisma.caminhao.create({
                data: {
                    modelo,
                    eixos,
                    eixos_carregado,
                    eixos_vazio,
                    pneus,
                    capacidade_kg,
                    consumo_medio_km_l
                }
            });
            return res.status(201).json(novoCaminhao);
        } catch (error) {
            console.error("Error creating truck:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },
    get: async (req: Request, res: Response): Promise<any> => {
        try {
            const caminhoes = await prisma.caminhao.findMany();
            return res.status(200).json(caminhoes);
        } catch (error) {
            console.error("Error fetching trucks:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
};
