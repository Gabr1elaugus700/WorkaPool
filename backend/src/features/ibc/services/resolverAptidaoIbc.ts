import type { IbcMotivoInaptidao } from "../types/IbcCadastro.types";
import type { IbcAptidao, IbcInspecaoResultado } from "../types/IbcInspecao.types";

export type ResolverAptidaoIbcInput = {
  motivoAtual: IbcMotivoInaptidao | null;
  dataLimiteVencida: boolean;
  /** Última inspeção de cada checklist vinculado já inspecionado. */
  ultimasPorChecklistVinculado: ReadonlyArray<IbcInspecaoResultado>;
};

export function resolverAptidaoIbc({
  motivoAtual,
  dataLimiteVencida,
  ultimasPorChecklistVinculado,
}: ResolverAptidaoIbcInput): IbcAptidao {
  if (motivoAtual === "DATA_LIMITE" || dataLimiteVencida) {
    return { aptidao: "INAPTO", motivoInaptidao: "DATA_LIMITE" };
  }
  if (ultimasPorChecklistVinculado.includes("REPROVADA")) {
    return { aptidao: "INAPTO", motivoInaptidao: "INSPECAO_REPROVADA" };
  }
  return { aptidao: "APTO", motivoInaptidao: null };
}
