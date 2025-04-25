import { Request, Response } from 'express';
import { getPedidosCarteira} from '../services/pedidosCarteira';

export async function getVendas(req: Request, res: Response) {
    try {
        const vendas = await getPedidosCarteira();
        res.json(vendas)
    } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        res.status(500).json({ error: 'Erro ao buscar vendas' });
    }   
}