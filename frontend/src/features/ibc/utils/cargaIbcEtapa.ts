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

/**
 * Etapa que a URL pede. `?origem=em-viagem` é o link antigo do detalhe em viagem
 * e vale mais do que o path, que nessa época não tinha etapa.
 */
function pedida(etapaParam: string | undefined, origem: string | null): CargaIbcEtapa | null {
  if (origem === "em-viagem") return "em-viagem";
  return parse(etapaParam);
}

/**
 * Etapa a mostrar e, quando a URL ainda é o link antigo ou uma etapa fora da vista,
 * o path canônico para onde redirecionar.
 */
function naRota(input: {
  codCar: number;
  etapaParam: string | undefined;
  origem: string | null;
  atual: CargaIbcEtapa;
}): { vista: CargaIbcEtapa; redirectTo: string | null } {
  const vista = resolverVista(input.atual, pedida(input.etapaParam, input.origem));
  const legado = input.origem === "em-viagem";
  const etapaForaDaVista = input.etapaParam != null && input.etapaParam !== vista;
  return {
    vista,
    redirectTo: legado || etapaForaDaVista ? path(input.codCar, vista) : null,
  };
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
  return atual === "em-viagem" ? "/expedicao-ibc/em-viagem" : "/expedicao-ibc";
}

export type CargaIbcCarregamento = "pagina" | "etapa" | null;

/**
 * Onde mostrar o carregamento. No primeiro acesso a conciliação decide a etapa atual,
 * então ocupa a página; logo após fechar a expedição a etapa já é Em viagem.
 */
function carregamento(input: {
  detalheCarregado: boolean;
  temExpedicao: boolean;
  viagemCarregada: boolean;
  erroConciliacao: boolean;
  fechouExpedicaoNestaTela: boolean;
}): CargaIbcCarregamento {
  if (!input.detalheCarregado) return "pagina";
  if (!input.temExpedicao || input.viagemCarregada || input.erroConciliacao) return null;
  return input.fechouExpedicaoNestaTela ? "etapa" : "pagina";
}

export const cargaIbcEtapa = {
  path,
  parse,
  resolverAtual,
  resolverVista,
  pedida,
  naRota,
  montarItens,
  voltarPara,
  carregamento,
};
