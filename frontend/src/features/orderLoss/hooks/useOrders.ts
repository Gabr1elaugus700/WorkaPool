import { useQuery } from "@tanstack/react-query";
import { OrderService } from "../services/ordersServices";
import { GetLostOrdersFilters } from "../types/orderLoss.types";

export const useLostOrdersFromSapiens = (filters?: GetLostOrdersFilters) => {
  return useQuery({
    queryKey: ["lost-orders-sapiens", filters],
    queryFn: async () => {
      console.log('🔍 Buscando pedidos do SAPIENS com filtros:', filters);
      const orders = await OrderService.getLost(filters);
      console.log('✅ Pedidos recebidos do SAPIENS:', orders?.length, 'pedidos');
      return orders;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
