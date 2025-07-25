import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const cargaController = {

    async CreateCarga(req: Request, res: Response): Promise<any> {
        const { destino, pesoMax, custoMin, situacao, previsaoSaida } = req.body;

        if (!destino || !pesoMax || !custoMin || !situacao || !previsaoSaida) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        try {
            const ultimaCarga = await prisma.cargas.findFirst({
                orderBy: {
                    codCar: 'desc',
                },
            });
            const novaCarga = await prisma.cargas.create({
                data: {
                    codCar: ultimaCarga ? ultimaCarga.codCar + 1 : 1,
                    // name,
                    destino,
                    pesoMax,
                    custoMin,
                    previsaoSaida: new Date(previsaoSaida),
                    situacao: situacao || 'ABERTA',
                },
            });

            return res.status(200).json(novaCarga);
        } catch (error) {
            console.error('Erro ao criar carga:', error);

            return res.status(500).json({ error: 'Erro ao criar carga.' });
        }
    },

    async ListarAbertas(req: Request, res: Response): Promise<any> {
        try {
            const cargas = await prisma.cargas.findMany();

            return res.status(200).json(cargas);
        } catch (error) {
            console.error('Erro ao buscar cargas abertas:', error);
            return res.status(500).json({ error: 'Erro ao buscar cargas' });
        }
    },

    async atualizarSitCarga(req: Request, res: Response): Promise<any> {
        const { id } = req.params;
        const { situacao } = req.body;

        if (!situacao) {
            return res.status(400).json({ message: 'Situação é obrigatória!' })
        };

        if (situacao === 'FECHADA') {
            const cargaFechada = await prisma.cargasFechadas.create({
                data: {
                    carga: {
                        connect: { id }
                    },
                    pedidos: []
                }
            });
            return res.status(200).json(cargaFechada);
        }

        try {
            const cargaAtualizada = await prisma.cargas.update({
                where: { id },
                data: { situacao },
            });
            return res.status(200).json(cargaAtualizada);
        } catch (error) {
            console.error('Erro ao Atualizar ', error);
            return res.status(500).json({ error: 'Erro ao alterar Situação' });
        }
    },

    async atualizarCargaCompleta(req: Request, res: Response): Promise<any> {
        const { id } = req.params;
        const {
            // name,
            destino,
            pesoMax,
            custoMin,
            previsaoSaida,
            situacao
        } = req.body;

        if (!destino || !pesoMax || !custoMin || !previsaoSaida || !situacao) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios para atualização completa.' });
        }

        try {
            const cargaAtualizada = await prisma.cargas.update({
                where: { id },
                data: {
                    // name,
                    destino,
                    pesoMax,
                    custoMin,
                    previsaoSaida: new Date(previsaoSaida),
                    situacao
                }
            });

            return res.status(200).json(cargaAtualizada);
        } catch (error) {
            console.error('Erro ao atualizar carga:', error);
            return res.status(500).json({ message: 'Erro ao atualizar carga.' });
        }
    }

}