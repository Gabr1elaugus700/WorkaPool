import type {
  IbcCadastroDTO,
  IbcMudancaTipo,
} from "../types/ibcCadastro.types";

/**
 * Rótulos PT-BR para aptidão e motivo de inaptidão do cadastro IBC.
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
  mudanca: {
    conversion: "Conversão para não homologado",
    product_change: "Mudança de produto",
    status_change: "Mudança de status",
  } satisfies Record<IbcMudancaTipo, string>,
} as const;
