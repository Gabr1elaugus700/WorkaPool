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

export type ChecklistDaEntrada = {
  checklistModeloId: string;
  nome: string;
};

export type InspecaoDaEntrada = {
  checklistModeloId: string;
  resultado: "APROVADA" | "REPROVADA";
  inspecionadoEm: Date;
};

export type EntradaParaConcluir = {
  id: string;
  ibcId: string;
  identificador: string;
  baixadoEm: Date | null;
  dataLimite: Date | null;
  motivoInaptidao: IbcMotivoInaptidao | null;
  checklistsAtivos: ChecklistDaEntrada[];
  inspecoes: InspecaoDaEntrada[];
};

export type DecidirConclusaoEntrada = (entrada: EntradaParaConcluir | null) => ConclusaoEntradaPersistencia;

export type ConclusaoEntradaPersistencia = {
  entradaId: string;
  concluidoPorId: string;
  concluidoEm: Date;
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: IbcMotivoInaptidao | null;
};

export type EntradaPatioConcluida = {
  id: string;
  ibcId: string;
  identificador: string;
  custodia: "PATIO";
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: IbcMotivoInaptidao | null;
  concluidoEm: Date;
};

export type EntradaPatioFilaItem = {
  id: string;
  ibcId: string;
  identificador: string;
  origem: EntradaPatioOrigem;
  abertoEm: Date;
  motivoInaptidao: IbcMotivoInaptidao | null;
  checklists: Array<ChecklistDaEntrada & { inspecionada: boolean }>;
};
