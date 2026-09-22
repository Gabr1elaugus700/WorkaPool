import { useQuery } from "@tanstack/react-query";
import { OverviewCustomerService } from "../services/overviewCustomerService";

export function useOverviewCustomerDetail(customerCode: number | null) {
  return useQuery({
    queryKey: ["overview-customer-detail", customerCode],
    queryFn: async () => {
      if (customerCode == null) {
        throw new Error("clienteId inválido");
      }
      return OverviewCustomerService.getDetail(customerCode);
    },
    enabled: customerCode != null,
    staleTime: 1000 * 30,
  });
}
