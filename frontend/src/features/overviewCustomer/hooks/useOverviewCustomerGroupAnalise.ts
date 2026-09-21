import { useQuery } from "@tanstack/react-query";
import { OverviewCustomerGroupAnaliseService } from "../services/overviewCustomerGroupAnaliseService";

export function useOverviewCustomerGroupAnalise(
  customerCode: number,
  grupoCodigo: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["overview-customer-group-analise", customerCode, grupoCodigo],
    queryFn: async () => {
      if (grupoCodigo == null) {
        throw new Error("Código do grupo inválido para consultar a análise.");
      }
      return OverviewCustomerGroupAnaliseService.getAnalise(customerCode, grupoCodigo);
    },
    enabled: grupoCodigo != null && enabled,
    staleTime: 1000 * 30,
  });
}
