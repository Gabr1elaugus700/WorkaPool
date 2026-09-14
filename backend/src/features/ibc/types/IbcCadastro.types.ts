export type IbcTipoCadastro = "NOVO" | "TROCA";

export type IbcMotivoInaptidao =
  | "AGUARDANDO_INSPECAO"
  | "DATA_LIMITE";

export type IbcCadastroRecord = {
  id: string;
  identificador: string;
  tipoCadastro: IbcTipoCadastro;
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: IbcMotivoInaptidao | null;
  custodia: "PATIO" | "EM_VIAGEM";
  dataLimite: Date | null;
  baixadoEm: Date | null;
  createdAt: Date;
  loteId?: string | null;
};

export type IbcLoteRecord = {
  id: string;
  numeroNf: string | null;
  dataLimite: Date;
  createdAt: Date;
};

export type CreateIbcLoteData = {
  numeroNf: string | null;
  dataLimite: Date;
};

export type CreateNovoIbcData = {
  identificador: string;
  tipoCadastro: "NOVO";
  aptidao: "INAPTO";
  motivoInaptidao: "AGUARDANDO_INSPECAO";
  custodia: "PATIO";
  dataLimite: Date;
  loteId?: string | null;
};
