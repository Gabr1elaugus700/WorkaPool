import { useQuery } from "@tanstack/react-query";
import { OverviewCustomerService } from "../services/overviewCustomerService";

export function useOverviewCustomerPurchasedProducts(customerCode: number | null) {
  return useQuery({
    queryKey: ["overview-customer-purchased-products", customerCode],
    queryFn: async () => {
      if (customerCode == null) {
        throw new Error("clienteId inválido");
      }
      return OverviewCustomerService.getPurchasedProducts(customerCode);
    },
    enabled: customerCode != null,
    staleTime: 1000 * 30,
  });
}
