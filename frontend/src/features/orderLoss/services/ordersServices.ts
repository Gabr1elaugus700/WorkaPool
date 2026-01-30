import { getBaseUrl } from "@/lib/apiBase"
import { Order, LostOrderFromSapiens, GetLostOrdersFilters, CreateOrderDTO, LossReasonCode } from "../types/orderLoss.types";

export const OrderService = {
    getAll: async (): Promise<Order[]> => {
        const response = await fetch(`${getBaseUrl()}/api/orders`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar pedidos: ${response.statusText}`);
        }
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

    create: async (data: CreateOrderDTO): Promise<Order> => {
        console.log('📤 [OrderService.create] URL:', `${getBaseUrl()}/api/orders`);
        console.log('📤 [OrderService.create] Payload sendo enviado:', JSON.stringify(data, null, 2));
        console.log('📤 [OrderService.create] Tipo de cada campo:', {
            orderNumber: typeof data.orderNumber,
            codRep: typeof data.codRep,
            status: typeof data.status,
        });
        
        const response = await fetch(`${getBaseUrl()}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        
        console.log('📥 [OrderService.create] Response status:', response.status);
        console.log('📥 [OrderService.create] Response OK?:', response.ok);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ [OrderService.create] Erro do servidor:', JSON.stringify(error, null, 2));
            throw new Error(error.error || "Erro ao criar pedido");
        }
        
        const result = await response.json();
        console.log('✅ [OrderService.create] Resposta recebida:', JSON.stringify(result, null, 2));
        return result;
    },

    // [POST] /api/orders/loss-reason
    addLossReason: async (
        orderId: string, 
        code: LossReasonCode, 
        description: string,
        submittedBy: string
    ): Promise<void> => {
        const payload = { 
            orderId, 
            code, 
            description,
            submittedBy
        };
        
        // console.log('📤 [OrderService.addLossReason] URL:', `${getBaseUrl()}/api/orders/loss-reason`);
        // console.log('📤 [OrderService.addLossReason] Payload sendo enviado:', JSON.stringify(payload, null, 2));
        // console.log('📤 [OrderService.addLossReason] Tipo de cada campo:', {
        //     orderId: typeof orderId,
        //     code: typeof code,
        //     description: typeof description,
        //     submittedBy: typeof submittedBy,
        // });
        
        const response = await fetch(`${getBaseUrl()}/api/orders/loss-reason`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        
        console.log('📥 [OrderService.addLossReason] Response status:', response.status);
        console.log('📥 [OrderService.addLossReason] Response OK?:', response.ok);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ [OrderService.addLossReason] Erro do servidor:', JSON.stringify(error, null, 2));
            throw new Error(error.error || "Erro ao adicionar motivo de perda");
        }
        
        const result = await response.json();
        console.log('✅ [OrderService.addLossReason] Resposta recebida:', JSON.stringify(result, null, 2));
        return result;
    },

    // Função auxiliar: Cria pedido e adiciona motivo de perda em uma operação
    createOrderWithLossReason: async (
        orderNumber: string,
        codRep: string ,
        idUser: string,
        code: LossReasonCode,
        description: string
    ): Promise<Order> => {
        console.log('🔧 [OrderService] createOrderWithLossReason iniciado');
        console.log('🔧 [OrderService] Parâmetros:', { orderNumber, codRep, code, description });
        
        try {
            // 1. Criar o pedido
            console.log('🔧 [OrderService] Passo 1: Criando pedido...');
            const orderData = {
                orderNumber,
                idUser,
                codRep,
                status: "LOST" as const,
            };
            console.log('🔧 [OrderService] Dados do pedido:', orderData);
            
            const order = await OrderService.create(orderData);
            console.log('✅ [OrderService] Pedido criado:', order);

            // 2. Adicionar motivo de perda
            console.log('🔧 [OrderService] Passo 2: Adicionando motivo de perda...');
            console.log('🔧 [OrderService] Dados do motivo:', { orderId: order.id, code, description, submittedBy: codRep });
            
            await OrderService.addLossReason(order.id, code, description, codRep);
            console.log('✅ [OrderService] Motivo de perda adicionado com sucesso');

            return order;
        } catch (error) {
            console.error('❌ [OrderService] Erro em createOrderWithLossReason:', error);
            throw error;
        }
    },

    update: async (id: string, data: Partial<Order>): Promise<Order> => {
        const response = await fetch(`${getBaseUrl()}/api/orders/${id}`, {
            method: "PUT",  
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao atualizar pedido");
        }
        
        return response.json();
    },
}