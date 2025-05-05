import {Request, Response } from 'express';
import { getVendedores } from '../services/vendedoresService';

export const listVendedores = async (req: Request, res: Response): Promise<any> => {
    try {
        const vendedores = await getVendedores();
        return res.json(vendedores);
    } catch (error) {
        console.error('Erro ao Buscar Vendedores', error);
        return res.status(500).json({ message: 'Erro interno ao  Buscar Vendedores' });
    }
}