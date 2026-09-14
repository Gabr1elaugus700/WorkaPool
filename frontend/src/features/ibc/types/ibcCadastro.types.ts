export type IbcCadastroDTO = {
  id: string;
  identificador: string;
  tipoCadastro: "NOVO" | "TROCA";
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: "AGUARDANDO_INSPECAO" | "DATA_LIMITE" | null;
  custodia: "PATIO" | "EM_VIAGEM";
  dataLimite: string | null;
  baixadoEm: string | null;
  createdAt: string;
  loteId?: string | null;
};

export type IbcAlertDTO = {
  identificador: string;
  motivo: "AGUARDANDO_INSPECAO" | "DATA_LIMITE";
};

export type CreateNovoIbcInput = {
  dataLimite: string;
};

export type CreateLoteIbcInput = {
  quantidade: number;
  dataLimite: string;
  numeroNf?: string | null;
};

export type IbcLoteDTO = {
  id: string;
  numeroNf: string | null;
  dataLimite: string;
  createdAt: string;
};

export type LoteSaldoWarningDTO =
  | {
      code: "OVER_SALDO";
      vivos: number;
      quantidade: number;
      saldo: number;
    }
  | {
      code: "SALDO_UNAVAILABLE";
      vivos: number;
      quantidade: number;
    };

export type CreateLoteIbcResultDTO = {
  items: IbcCadastroDTO[];
  lote: IbcLoteDTO;
  warning?: LoteSaldoWarningDTO;
};
