import { useQuery } from "@tanstack/react-query";
import { conciliacaoErpService } from "../services/conciliacaoErpService";
import type { BucketConsultaConciliacaoErp } from "../types/conciliacaoErp.types";

export function useConciliacaoErp(bucket?: BucketConsultaConciliacaoErp) {
  return useQuery({
    queryKey: ["ibc", "conciliacao-erp", bucket ?? null],
    queryFn: () => conciliacaoErpService.obter(bucket),
  });
}
