export type IbcTipoCadastro = "NOVO" | "TROCA";

export type IbcMotivoInaptidao =
  | "AGUARDANDO_INSPECAO"
  | "DATA_LIMITE";

export type IbcCadastroRecord = {
  id: string;
  identificador: string;
  prefixo?: string | null;
  sequencial?: number | null;
  tipoCadastro: IbcTipoCadastro;
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: IbcMotivoInaptidao | null;
  custodia: "PATIO" | "EM_VIAGEM";
  dataLimite: Date | null;
  baixadoEm: Date | null;
  createdAt: Date;
  loteId?: string | null;
  produtoId?: string | null;
  convertedToContainerId?: string | null;
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
  prefixo: string;
  tipoCadastro: "NOVO";
  aptidao: "INAPTO";
  motivoInaptidao: "AGUARDANDO_INSPECAO";
  custodia: "PATIO";
  dataLimite: Date;
  loteId?: string | null;
  produtoId: string;
};

export type IbcProdutoRecord = {
  id: string;
  nome: string;
  abreviacao: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IbcProdutoListItem = IbcProdutoRecord & { possuiIbcs: boolean };

export type IbcStructuralChangeType = "conversion" | "product_change" | "status_change";

export type CreateDerivedIbcData = {
  sourceIbcId: string;
  prefixo: string;
  produtoId: string | null;
  actorId: string;
  observation: string | null;
  changeType: IbcStructuralChangeType;
};

export type IbcConversionHistoryRecord = {
  id: string;
  changeType: IbcStructuralChangeType;
  observation: string | null;
  actorId: string;
  actorName: string | null;
  createdAt: Date;
  from: { id: string; identificador: string };
  to: { id: string; identificador: string };
};
