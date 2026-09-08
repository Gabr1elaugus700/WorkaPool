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
};

export type CreateNovoIbcData = {
  identificador: string;
  tipoCadastro: "NOVO";
  aptidao: "INAPTO";
  motivoInaptidao: "AGUARDANDO_INSPECAO";
  custodia: "PATIO";
  dataLimite: Date;
};
