import { useQuery } from "@tanstack/react-query";
import { OrderService } from "../services/ordersServices";
import { GetLostOrdersFilters } from "../types/orderLoss.types";

// Hook para buscar pedidos perdidos do SAPIENS
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

// Hook para buscar todos os pedidos locais com justificativas
export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      console.log('🔍 Buscando pedidos locais com justificativas');
      const orders = await OrderService.getAll();
      console.log('✅ Pedidos locais recebidos:', orders?.length, 'pedidos');
      return orders;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
