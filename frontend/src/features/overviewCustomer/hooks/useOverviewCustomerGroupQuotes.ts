import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { OverviewCustomerGroupQuotesService } from "../services/overviewCustomerGroupQuotesService";
import { buildOverviewCustomerGroupQuotesQueryKey } from "../utils/overviewCustomerGroupQuotesQueryKey.utils";

export function useOverviewCustomerGroupQuotes(
  customerCode: number,
  grupoCodigo: string | null,
  options: {
    productCode?: string | null;
    includeOtherCustomers?: boolean;
    enabled?: boolean;
  } = {},
) {
  const {
    productCode = null,
    includeOtherCustomers = false,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: buildOverviewCustomerGroupQuotesQueryKey(
      customerCode,
      grupoCodigo,
      productCode,
      includeOtherCustomers,
    ),
    queryFn: async () => {
      if (grupoCodigo == null) {
        throw new Error("Código do grupo inválido para consultar cotações.");
      }
      return OverviewCustomerGroupQuotesService.getQuotes(
        customerCode,
        grupoCodigo,
        {
          productCode: productCode ?? undefined,
          reveal: includeOtherCustomers,
        },
      );
    },
    enabled: grupoCodigo != null && enabled,
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}
