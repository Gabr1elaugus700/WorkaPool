import type {
  IbcAlertDTO,
  IbcCadastroDTO,
  IbcMudancaTipo,
} from "../types/ibcCadastro.types";

/**
 * Rótulos PT-BR para aptidão, motivo de inaptidão e alertas do cadastro IBC.
 */
export const ibcCadastroLabels = {
  aptidao: {
    APTO: "Apto",
    INAPTO: "Inapto",
  } satisfies Record<IbcCadastroDTO["aptidao"], string>,
  motivoInaptidao: {
    AGUARDANDO_INSPECAO: "Aguardando inspeção",
    DATA_LIMITE: "Data limite",
  } satisfies Record<NonNullable<IbcCadastroDTO["motivoInaptidao"]>, string>,
  alertaMotivo: {
    SEM_INSPECAO: "Sem inspeção",
    DATA_LIMITE: "Data limite",
    AGUARDANDO_INSPECAO: "Aguardando inspeção",
  } satisfies Record<IbcAlertDTO["motivo"], string>,
  mudanca: {
    conversion: "Conversão para não homologado",
    product_change: "Mudança de produto",
    status_change: "Mudança de status",
  } satisfies Record<IbcMudancaTipo, string>,
} as const;
