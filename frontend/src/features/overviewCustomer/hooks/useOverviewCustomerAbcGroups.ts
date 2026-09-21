import { useQuery } from "@tanstack/react-query";

export function useOverviewCustomerAbcGroups(
  customerCode: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["overview-customer-abc-groups", customerCode],
    queryFn: async () => {
      if (customerCode == null) {
        throw new Error("clienteId inválido");
      }
      const { OverviewCustomerAbcGroupsService } = await import(
        "../services/overviewCustomerAbcGroupsService"
      );
      return OverviewCustomerAbcGroupsService.getAbcGroups(customerCode);
    },
    enabled: customerCode != null && enabled,
    staleTime: 1000 * 30,
    retry: false,
    refetchOnMount: false,
  });
}
