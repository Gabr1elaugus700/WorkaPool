import type { IbcMotivoInaptidao, IbcTipoCadastro } from "./IbcCadastro.types";
import type { IbcCustodiaValue } from "./IbcExpedicao.types";

export type EntradaPatioOrigem = "RETORNO" | "TROCA";

export type EntradaPatioStatus = "PENDENTE" | "CONCLUIDA";

/** Estado do IBC lido com a linha travada, antes de abrir a entrada. */
export type IbcParaAbrirEntrada = {
  id: string;
  identificador: string;
  baixadoEm: Date | null;
  custodia: IbcCustodiaValue;
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: IbcMotivoInaptidao | null;
  dataLimite: Date | null;
  tipoCadastro: IbcTipoCadastro;
  aquisicao: "COMPRA" | "TROCA";
};

export type AbrirEntradaPersistencia = {
  origem: EntradaPatioOrigem;
  abertoPorId: string;
  abertoEm: Date;
  motivoInaptidao: IbcMotivoInaptidao;
};

export type DecidirAberturaEntrada = (
  ibc: IbcParaAbrirEntrada | null,
  jaPendente: boolean,
) => AbrirEntradaPersistencia;

export type EntradaPatioAberta = {
  id: string;
  ibcId: string;
  identificador: string;
  origem: EntradaPatioOrigem;
  status: "PENDENTE";
  abertoEm: Date;
  custodia: "ENTRADA";
  aptidao: "INAPTO";
  motivoInaptidao: IbcMotivoInaptidao;
};
