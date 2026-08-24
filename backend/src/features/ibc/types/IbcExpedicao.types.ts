export type IbcAptidaoValue = "APTO" | "INAPTO";

export type IbcCustodiaValue = "PATIO" | "EM_VIAGEM";

export type IbcRecord = {
  id: string;
  identificador: string;
  aptidao: IbcAptidaoValue;
  custodia: IbcCustodiaValue;
  createdAt: Date;
};

export type AlocacaoIbcRecord = {
  id: string;
  ibcId: string;
  cargaId: string;
  numPed: string;
  alocadoPorId: string;
  alocadoEm: Date;
  expedicaoIbcId: string | null;
  identificador: string;
};

export type ExpedicaoIbcRecord = {
  id: string;
  cargaId: string;
  fechadoPorId: string;
  fechadoEm: Date;
};

export type CargaExpedicaoRef = {
  id: string;
  codCar: number;
  destino: string;
  situacao: string;
  previsaoSaida: Date;
};

export type CreateAlocacaoIbcData = {
  ibcId: string;
  cargaId: string;
  numPed: string;
  alocadoPorId: string;
};

export type FecharExpedicaoIbcData = {
  cargaId: string;
  fechadoPorId: string;
  alocacaoIds: string[];
  ibcIds: string[];
};
