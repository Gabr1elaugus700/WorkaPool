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
};

export type IbcAlertDTO = {
  identificador: string;
  motivo: "AGUARDANDO_INSPECAO" | "DATA_LIMITE";
};

export type CreateNovoIbcInput = {
  dataLimite: string;
};
