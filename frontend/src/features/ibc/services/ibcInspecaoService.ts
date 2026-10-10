import { apiFetchJson } from "@/lib/apiFetch";
import type { RegistrarIbcInspecaoInput, RegistrarIbcInspecaoResultDTO } from "../types/ibcInspecao.types";

export const ibcInspecaoService = {
  registrar: (ibcId: string, input: RegistrarIbcInspecaoInput): Promise<RegistrarIbcInspecaoResultDTO> =>
    apiFetchJson<RegistrarIbcInspecaoResultDTO>(`/api/ibc/${ibcId}/inspecoes`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
