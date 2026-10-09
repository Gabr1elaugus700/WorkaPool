import type {
  IbcAlertDTO,
  IbcCadastroDTO,
  IbcMotivoInaptidao,
  IbcMudancaTipo,
} from "../types/ibcCadastro.types";

const motivoInaptidao = {
  AGUARDANDO_INSPECAO: "Aguardando inspeção",
  DATA_LIMITE: "Data limite",
  INSPECAO_REPROVADA: "Inspeção reprovada",
} as const satisfies Record<IbcMotivoInaptidao, string>;

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
  mudanca: {
    conversion: "Conversão para não homologado",
    product_change: "Mudança de produto",
    status_change: "Mudança de status",
  } satisfies Record<IbcMudancaTipo, string>,
} as const;
