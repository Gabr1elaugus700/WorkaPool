import { apiFetchJson } from "@/lib/apiFetch";
import type {
  IbcInspecaoHistoricoDTO,
  RegistrarIbcInspecaoInput,
  RegistrarIbcInspecaoResultDTO,
} from "../types/ibcInspecao.types";

export const ibcInspecaoService = {
  listar: (ibcId: string): Promise<IbcInspecaoHistoricoDTO[]> =>
    apiFetchJson<IbcInspecaoHistoricoDTO[]>(`/api/ibc/${ibcId}/inspecoes`),
  registrar: (ibcId: string, input: RegistrarIbcInspecaoInput): Promise<RegistrarIbcInspecaoResultDTO> =>
    apiFetchJson<RegistrarIbcInspecaoResultDTO>(`/api/ibc/${ibcId}/inspecoes`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
