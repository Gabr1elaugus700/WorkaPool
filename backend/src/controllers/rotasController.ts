import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const cadastroCaminhaoController = {
    create: async (req: Request, res: Response): Promise<any> => {
        const {  } = req.body;

        try {
            const novoCaminhao = await prisma.rota_base.create({
                data: {
                }
            });
            return res.status(201).json(novoCaminhao);
        } catch (error) {
            console.error("Error creating truck:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
};
