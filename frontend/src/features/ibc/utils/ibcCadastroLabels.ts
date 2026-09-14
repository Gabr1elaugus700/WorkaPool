import type { IbcCadastroDTO } from "../types/ibcCadastro.types";

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
} as const;
