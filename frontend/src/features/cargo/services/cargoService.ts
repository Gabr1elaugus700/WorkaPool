import { getBaseUrl } from '@/lib/apiBase';
import { Carga, Pedido } from '../types/cargo.types';

export const cargoService = {
    getPedidosFechados: async (codRep: number): Promise<Pedido[]> => {
        const response = await fetch(`${getBaseUrl()}/api/cargo/pedidos-fechados/${codRep}`);
        if (!response.ok) throw new Error('Erro ao buscar pedidos');
        
        return response.json();
    },

    getAllCargas: async (): Promise<Carga[]> => {
        const response = await fetch(`${getBaseUrl()}/api/cargo/listarAbertas`);
        if (!response.ok) throw new Error('Erro ao buscar cargas');
        return response.json();
    },
}