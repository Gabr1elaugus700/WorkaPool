import { useQuery } from "@tanstack/react-query";
import { OverviewCustomerService } from "../services/overviewCustomerService";

export function useOverviewCustomerList(search: string, page: number) {
  return useQuery({
    queryKey: ["overview-customer-list", search, page],
    queryFn: () => OverviewCustomerService.list({ search, page }),
    staleTime: 1000 * 30,
  });
}
