import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


export const CreateCarga = async (req: Request, res: Response): Promise<any> => {
    const { name, destino, pesoMax, custoMin, situacao } = req.body;
    
    if(!name || !destino || !pesoMax || !custoMin || !situacao) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try{
        const ultimaCarga = await prisma.cargas.findFirst({
            orderBy: {
                codCar: 'desc',
            },
        });
        const novaCarga = await prisma.cargas.create({
            data: {
                codCar: ultimaCarga ? ultimaCarga.codCar + 1 : 1,
                name,
                destino,
                pesoMax,
                custoMin,
                situacao: situacao || 'ABERTA',
            },
        });
        return res.status(201).json(novaCarga);
    } catch (error) {
        console.error('Erro ao criar carga:', error);
        return res.status(500).json({ error: 'Erro ao criar carga.' });
    }
};