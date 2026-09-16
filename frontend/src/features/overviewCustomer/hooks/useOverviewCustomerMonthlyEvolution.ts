import { useQuery } from "@tanstack/react-query";
import { OverviewCustomerService } from "../services/overviewCustomerService";

export function useOverviewCustomerMonthlyEvolution(customerCode: number | null) {
  return useQuery({
    queryKey: ["overview-customer-monthly-evolution", customerCode],
    queryFn: async () => {
      if (customerCode == null) {
        throw new Error("clienteId inválido");
      }
      return OverviewCustomerService.getMonthlyEvolution(customerCode);
    },
    enabled: customerCode != null,
    staleTime: 1000 * 30,
  });
}
