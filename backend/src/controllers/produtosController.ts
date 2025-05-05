import {Request, Response } from 'express';
import { getProdutos } from '../services/produtosService';

export const listProdutos = async (req: Request, res: Response): Promise<any> => {
    try {
        const produtos = await getProdutos();
        return res.json(produtos);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        return res.status(500).json({ message: 'Erro interno ao listar produtos' });
    }
}