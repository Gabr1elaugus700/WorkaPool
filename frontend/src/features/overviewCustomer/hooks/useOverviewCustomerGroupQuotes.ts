import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { OverviewCustomerGroupQuotesService } from "../services/overviewCustomerGroupQuotesService";

export function useOverviewCustomerGroupQuotes(
  customerCode: number,
  grupoCodigo: string | null,
  options: {
    productCode?: string | null;
    reveal?: boolean;
    enabled?: boolean;
  } = {},
) {
  const { productCode = null, reveal = false, enabled = true } = options;

  return useQuery({
    queryKey: [
      "overview-customer-group-quotes",
      customerCode,
      grupoCodigo,
      productCode,
      reveal,
    ],
    queryFn: async () => {
      if (grupoCodigo == null) {
        throw new Error("Código do grupo inválido para consultar cotações.");
      }
      return OverviewCustomerGroupQuotesService.getQuotes(
        customerCode,
        grupoCodigo,
        {
          productCode: productCode ?? undefined,
          reveal,
        },
      );
    },
    enabled: grupoCodigo != null && enabled,
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}
