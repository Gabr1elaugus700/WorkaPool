import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import { get } from 'http';
const prisma = new PrismaClient();

export const parametrosGlobaisViagemController = {
    create: async (req: Request, res: Response): Promise<any> => {
        const { valor_diesel_s10_sem_icms, valor_diesel_s10_com_icms, valor_salario_motorista_dia, valor_refeicao_motorista_dia, valor_ajuda_custo_motorista, valor_chapa_descarga, valor_desgaste_pneus } = req.body;
        console.log("Received parameters:", req.body);
        try {
            const parametrosGlobaisViagem = await prisma.parametrosGlobaisViagem.create({
                data: {
                    valor_diesel_s10_sem_icms,
                    valor_diesel_s10_com_icms,
                    valor_salario_motorista_dia,
                    valor_refeicao_motorista_dia,
                    valor_ajuda_custo_motorista,
                    valor_chapa_descarga,
                    valor_desgaste_pneus
                }
            });
            return res.status(201).json(parametrosGlobaisViagem);
        } catch (error) {
            console.error("Erro ao criar Parametros", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },
    patch: async (req: Request, res: Response): Promise<any> => {
        const { valor_diesel_s10_sem_icms, valor_diesel_s10_com_icms, valor_salario_motorista_dia, valor_refeicao_motorista_dia, valor_ajuda_custo_motorista, valor_chapa_descarga, valor_desgaste_pneus } = req.body;
        console.log("Received parameters:", req.body);
        try {
            const parametrosGlobaisViagem = await prisma.parametrosGlobaisViagem.update({
                where: { id: 2 }, // Assuming you want to update a single record
                data: {
                    valor_diesel_s10_sem_icms,
                    valor_diesel_s10_com_icms,
                    valor_salario_motorista_dia,
                    valor_refeicao_motorista_dia,
                    valor_ajuda_custo_motorista,
                    valor_chapa_descarga,
                    valor_desgaste_pneus
                }
            });
            return res.status(201).json(parametrosGlobaisViagem);
        } catch (error) {
            console.error("Erro ao criar Parametros", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },
    get: async (req: Request, res: Response): Promise<any> => {
        try {
            const parametrosGlobaisViagem = await prisma.parametrosGlobaisViagem.findFirst({
                where: { id: 2 } // Assuming you want to get a single record
            });
            if (!parametrosGlobaisViagem) {
                return res.status(404).json({ error: "Parâmetros não encontrados" });
            }
            return res.status(200).json(parametrosGlobaisViagem);
        } catch (error) {
            console.error("Erro ao buscar parâmetros globais de viagem:", error);
            return res.status(500).json({ error: "Erro ao buscar parâmetros globais de viagem" });
        }
    }
};