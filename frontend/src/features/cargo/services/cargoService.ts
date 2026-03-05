import { getBaseUrl } from '@/lib/apiBase';
import { Carga, Pedido } from '../types/cargo.types';

export const cargoService = {
    getPedidosFechados: async (codRep: number): Promise<Pedido[]> => {
        const response = await fetch(`${getBaseUrl()}/api/cargo/pedidos-fechados/${codRep}`);
        console.log("Resposta do backend (pedidos fechados):", response);
        if (!response.ok) throw new Error('Erro ao buscar pedidos');
        
        return response.json();
    },

    getAllCargas: async (): Promise<Carga[]> => {
        const response = await fetch(`${getBaseUrl()}/api/cargo/listar-abertas`);
        if (!response.ok) throw new Error('Erro ao buscar cargas');
        return response.json();
    },

    createCarga: async (input: {
        destino: string;
        pesoMax: number;
        situacao: string;
        previsaoSaida: string;
    }): Promise<Carga> => {
        const response = await fetch(`${getBaseUrl()}/api/cargo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error('Erro ao criar carga');
        }

        return response.json();
    }
}