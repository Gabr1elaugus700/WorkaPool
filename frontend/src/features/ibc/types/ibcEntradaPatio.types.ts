import type { IbcMotivoInaptidao } from "./ibcCadastro.types";

export type EntradaPatioOrigem = "RETORNO" | "TROCA";

export type EntradaPatioFilaItem = {
  id: string;
  ibcId: string;
  identificador: string;
  origem: EntradaPatioOrigem;
  abertoEm: string;
  motivoInaptidao: IbcMotivoInaptidao | null;
  checklists: Array<{
    checklistModeloId: string;
    nome: string;
    inspecionada: boolean;
  }>;
};

export type EntradaPatioConcluida = {
  id: string;
  ibcId: string;
  identificador: string;
  custodia: "PATIO";
  aptidao: "APTO" | "INAPTO";
  motivoInaptidao: IbcMotivoInaptidao | null;
  concluidoEm: string;
};
