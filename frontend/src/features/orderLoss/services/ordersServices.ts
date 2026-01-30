import { getBaseUrl } from "@/lib/apiBase"
import { Order, LostOrderFromSapiens, GetLostOrdersFilters } from "../types/orderLoss.types";

export const OrderService = {
    getAll: async (): Promise<Order[]> => {
        const response = await fetch(`${getBaseUrl()}/api/orders`);
        return response.json();
    },

    getLost: async (filters?: GetLostOrdersFilters): Promise<LostOrderFromSapiens[]> => {
        const params = new URLSearchParams();
        if (filters?.codRep) params.append('codRep', filters.codRep);

        const url = `${getBaseUrl()}/api/orders/lost-sapiens${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao buscar pedidos perdidos: ${response.statusText}`);
        }
        return response.json();
    },

    create: async (data: Order): Promise<Order> => {
        const response = await fetch(`${getBaseUrl()}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // [POST] /api/orders/loss-reason
    addLossReason: async (orderId: string, reasonCode: string, reasonDescription: string): Promise<Order> => {
        const response = await fetch(`${getBaseUrl()}/api/orders/loss-reason`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId, reasonCode, reasonDescription }),
        });
        return response.json();
    },

    update: async (id: string, data: Partial<Order>): Promise<Order> => {
        const response = await fetch(`${getBaseUrl()}/api/orders/${id}`, {
            method: "PUT",  
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return response.json();
    },
}