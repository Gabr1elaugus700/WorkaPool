import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const fretesController = {

    rotaBase: async (req: Request, res: Response): Promise<any> => {
        const { origem, destino, total_km, dias_viagem } = req.body;

        try {
            const novaRota = await prisma.rota_base.create({
                data: {
                    origem,
                    destino,
                    total_km,
                    dias_viagem
                }
            });
            return res.status(200).json(novaRota);
        } catch (error) {
            console.error("Error creating route:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    caminhaoRota: async (req: Request, res: Response): Promise<any> => {
        const { 
            rota_base_id,
            caminhao_id,
            pedagio_ida,
            pedagio_volta,
            custo_combustivel,
            custo_total,
            salario_motorista_rota,
            refeicao_motorista_rota,
            ajuda_custo_motorista_rota,
            chapa_descarga_rota,
            desgaste_pneus_rota
        
        } = req.body;

        try {
            const associacao = await prisma.caminhaoRota.create({
                data: { 
                    rota_base_id,
                    caminhao_id,
                    pedagio_ida,
                    pedagio_volta,
                    custo_combustivel,
                    custo_total,
                    salario_motorista_rota,
                    refeicao_motorista_rota,
                    ajuda_custo_motorista_rota,
                    chapa_descarga_rota,
                    desgaste_pneus_rota,
                }
            });
            return res.status(200).json(associacao);
        } catch (error) {
            console.error("Error associating truck with route:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    solicitacaoRota: async (req: Request, res: Response): Promise<any> => {
        const { peso, origem, destino, status, solicitante_user } = req.body;

        try {
            const novaSolicitacao = await prisma.solicitacaoRota.create({
                data: {
                    peso,
                    origem,
                    destino,
                    status,
                    solicitante_user
                }
            });
            return res.status(200).json(novaSolicitacao);
        } catch (error) {
            console.error("Error creating request:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    listarRotas: async (req: Request, res: Response): Promise<any> => {
        try {
            const rotas = await prisma.rota_base.findMany();
            return res.status(200).json(rotas);
        } catch (error) {
            console.error("Error fetching routes:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    listarRotasSolicitadas: async (req: Request, res: Response): Promise<any> => {
        try {
            const solicitacoes = await prisma.solicitacaoRota.findMany({
                where:{
                    status: 'PENDENTE'
                }
            });
            return res.status(200).json(solicitacoes);
        } catch (error) {
            console.error("Error fetching route requests:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },
    getCaminhaoRota: async (req: Request, res: Response): Promise<any> => {
        const { rotaId } = req.params;
        try {
            const caminhaoRota = await prisma.caminhaoRota.findMany({
                where: { rota_base_id: Number(rotaId) }
            });
            if (!caminhaoRota || caminhaoRota.length === 0) {
                return res.status(200).json({});
            }
            return res.status(200).json(caminhaoRota);
        } catch (error) {
            console.error("Erro ao buscar caminhão por rota:", error);
            return res.status(500).json({ error: "Erro ao buscar caminhão por rota" });
        }
    },
    putCaminhaoRota: async (req: Request, res: Response): Promise<any> => {
        const { rota_id, caminhao_id, pedagio_ida, pedagio_volta, custo_combustivel, custo_total, salario_motorista_rota, refeicao_motorista_rota, ajuda_custo_motorista_rota, chapa_descarga_rota, desgaste_pneus_rota } = req.body;

        try {
            const updatedCaminhaoRota = await prisma.caminhaoRota.update({
                where: { id: Number(rota_id) },
                data: {
                    caminhao_id,
                    pedagio_ida,
                    pedagio_volta,
                    custo_combustivel,
                    custo_total,
                    salario_motorista_rota,
                    refeicao_motorista_rota,
                    ajuda_custo_motorista_rota,
                    chapa_descarga_rota,
                    desgaste_pneus_rota
                }
            });
            return res.status(200).json(updatedCaminhaoRota);
        } catch (error) {
            console.error("Error updating truck route association:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}