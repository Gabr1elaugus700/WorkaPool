import type { ExpedicaoIbcSection } from "./expedicaoIbcSections";

const ETAPAS = [
  { id: "preparacao", label: "Preparação", station: "aguardando" },
  { id: "em-viagem", label: "Em viagem", station: "em-viagem" },
  { id: "fechar-viagem", label: "Fechar viagem", station: "entrada" },
] as const satisfies readonly { id: string; label: string; station: ExpedicaoIbcSection }[];

export type CargaIbcEtapa = (typeof ETAPAS)[number]["id"];

export type CargaIbcEtapaEstado = "concluida" | "atual" | "futura";

export type CargaIbcEtapaItem = {
  id: CargaIbcEtapa;
  label: string;
  station: ExpedicaoIbcSection;
  estado: CargaIbcEtapaEstado;
  /** `null` quando a etapa ainda não pode ser aberta. */
  to: string | null;
  selecionada: boolean;
};

const ORDEM: readonly CargaIbcEtapa[] = ETAPAS.map((etapa) => etapa.id);

function path(codCar: number, etapa: CargaIbcEtapa): string {
  return `/expedicao-ibc/${codCar}/${etapa}`;
}

function parse(raw: string | undefined): CargaIbcEtapa | null {
  return ORDEM.find((etapa) => etapa === raw) ?? null;
}

function resolverAtual(carga: { temExpedicao: boolean; viagemFechadaEm: string | null }): CargaIbcEtapa {
  if (!carga.temExpedicao) return "preparacao";
  return carga.viagemFechadaEm == null ? "em-viagem" : "fechar-viagem";
}

function alcancavel(atual: CargaIbcEtapa, etapa: CargaIbcEtapa): boolean {
  return etapa === "preparacao" || atual !== "preparacao";
}

function resolverVista(atual: CargaIbcEtapa, pedida: CargaIbcEtapa | null): CargaIbcEtapa {
  return pedida != null && alcancavel(atual, pedida) ? pedida : atual;
}

function montarItens(input: {
  codCar: number;
  atual: CargaIbcEtapa;
  vista: CargaIbcEtapa;
  viagemFechada: boolean;
}): CargaIbcEtapaItem[] {
  const indiceAtual = ORDEM.indexOf(input.atual);
  return ETAPAS.map((etapa, indice) => {
    let estado: CargaIbcEtapaEstado = "futura";
    if (input.viagemFechada || indice < indiceAtual) estado = "concluida";
    else if (indice === indiceAtual) estado = "atual";
    return {
      ...etapa,
      estado,
      to: alcancavel(input.atual, etapa.id) ? path(input.codCar, etapa.id) : null,
      selecionada: etapa.id === input.vista,
    };
  });
}

function voltarPara(atual: CargaIbcEtapa): string {
  return atual === "preparacao" ? "/expedicao-ibc" : "/expedicao-ibc/em-viagem";
}

export const cargaIbcEtapa = {
  path,
  parse,
  resolverAtual,
  resolverVista,
  montarItens,
  voltarPara,
};
