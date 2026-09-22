import { useQuery } from "@tanstack/react-query";
import { OverviewCustomerService } from "../services/overviewCustomerService";

export function useOverviewCustomerMonthlyEvolution(
  customerCode: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["overview-customer-monthly-evolution", customerCode],
    queryFn: async () => {
      if (customerCode == null) {
        throw new Error("Código do cliente inválido para consultar a evolução mensal.");
      }
      return OverviewCustomerService.getMonthlyEvolution(customerCode);
    },
    enabled: customerCode != null && enabled,
    staleTime: 1000 * 30,
  });
}
