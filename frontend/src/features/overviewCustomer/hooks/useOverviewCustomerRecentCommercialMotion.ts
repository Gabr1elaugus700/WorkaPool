import { useQuery } from "@tanstack/react-query";
import { OverviewCustomerService } from "../services/overviewCustomerService";

export function useOverviewCustomerRecentCommercialMotion(customerCode: number | null) {
  return useQuery({
    queryKey: ["overview-customer-recent-commercial-motion", customerCode],
    queryFn: async () => {
      if (customerCode == null) {
        throw new Error("clienteId inválido");
      }
      return OverviewCustomerService.getRecentCommercialMotion(customerCode);
    },
    enabled: customerCode != null,
    staleTime: 1000 * 30,
  });
}
