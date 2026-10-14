import { apiFetchJson } from "@/lib/apiFetch";
import type { BucketConsultaConciliacaoErp, RelatorioConciliacaoErp } from "../types/conciliacaoErp.types";

export const conciliacaoErpService = {
  obter(bucket?: BucketConsultaConciliacaoErp): Promise<RelatorioConciliacaoErp> {
    const query = bucket ? `?bucket=${encodeURIComponent(bucket)}` : "";
    return apiFetchJson<RelatorioConciliacaoErp>(`/api/ibc/conciliacao-erp${query}`);
  },
};
