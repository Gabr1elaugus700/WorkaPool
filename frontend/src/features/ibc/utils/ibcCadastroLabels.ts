import type {
  IbcAlertDTO,
  IbcCadastroDTO,
  IbcMotivoInaptidao,
  IbcMudancaTipo,
} from "../types/ibcCadastro.types";
import type { IbcInspecaoResultado } from "../types/ibcInspecao.types";

const motivoInaptidao = {
  AGUARDANDO_INSPECAO: "Aguardando inspeção",
  DATA_LIMITE: "Data limite",
  INSPECAO_REPROVADA: "Inspeção reprovada",
} as const satisfies Record<IbcMotivoInaptidao, string>;

/** Motivos de alerta que bloqueiam o IBC e ganham destaque destrutivo. */
export const IBC_ALERTA_MOTIVOS_DESTRUTIVOS: ReadonlySet<IbcAlertDTO["motivo"]> = new Set([
  "DATA_LIMITE",
  "INSPECAO_REPROVADA",
]);

/**
 * Rótulos PT-BR para aptidão, motivo de inaptidão e alertas do cadastro IBC.
 */
export const ibcCadastroLabels = {
  aptidao: {
    APTO: "Apto",
    INAPTO: "Inapto",
  } satisfies Record<IbcCadastroDTO["aptidao"], string>,
  motivoInaptidao,
  alertaMotivo: {
    ...motivoInaptidao,
    SEM_INSPECAO: "Sem inspeção",
  } satisfies Record<IbcAlertDTO["motivo"], string>,
  inspecaoResultado: {
    APROVADA: "Aprovada",
    REPROVADA: "Reprovada",
  } satisfies Record<IbcInspecaoResultado, string>,
  mudanca: {
    conversion: "Conversão para não homologado",
    product_change: "Mudança de produto",
    status_change: "Mudança de status",
  } satisfies Record<IbcMudancaTipo, string>,
} as const;
