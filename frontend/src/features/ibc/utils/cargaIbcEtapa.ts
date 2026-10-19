import type { ExpedicaoIbcSection } from "./expedicaoIbcSections";

export const CARGA_IBC_ETAPAS = [
  { id: "preparacao", label: "Preparação", station: "aguardando" },
  { id: "em-viagem", label: "Em viagem", station: "em-viagem" },
  { id: "fechar-viagem", label: "Fechar viagem", station: "entrada" },
] as const satisfies readonly { id: string; label: string; station: ExpedicaoIbcSection }[];

export type CargaIbcEtapa = (typeof CARGA_IBC_ETAPAS)[number]["id"];

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

const ORDEM: readonly CargaIbcEtapa[] = CARGA_IBC_ETAPAS.map((etapa) => etapa.id);

export function cargaIbcEtapaPath(codCar: number, etapa: CargaIbcEtapa): string {
  return `/expedicao-ibc/${codCar}/${etapa}`;
}

export function parseCargaIbcEtapa(raw: string | undefined): CargaIbcEtapa | null {
  return ORDEM.find((etapa) => etapa === raw) ?? null;
}

export function resolveCargaIbcEtapaAtual(carga: {
  temExpedicao: boolean;
  viagemFechadaEm: string | null;
}): CargaIbcEtapa {
  if (!carga.temExpedicao) return "preparacao";
  return carga.viagemFechadaEm == null ? "em-viagem" : "fechar-viagem";
}

function alcancavel(atual: CargaIbcEtapa, etapa: CargaIbcEtapa): boolean {
  return etapa === "preparacao" || atual !== "preparacao";
}

export function resolveCargaIbcEtapaVista(
  atual: CargaIbcEtapa,
  pedida: CargaIbcEtapa | null,
): CargaIbcEtapa {
  return pedida != null && alcancavel(atual, pedida) ? pedida : atual;
}

export function buildCargaIbcEtapas(input: {
  codCar: number;
  atual: CargaIbcEtapa;
  vista: CargaIbcEtapa;
  viagemFechada: boolean;
}): CargaIbcEtapaItem[] {
  const indiceAtual = ORDEM.indexOf(input.atual);
  return CARGA_IBC_ETAPAS.map((etapa, indice) => {
    let estado: CargaIbcEtapaEstado = "futura";
    if (input.viagemFechada || indice < indiceAtual) estado = "concluida";
    else if (indice === indiceAtual) estado = "atual";
    return {
      ...etapa,
      estado,
      to: alcancavel(input.atual, etapa.id) ? cargaIbcEtapaPath(input.codCar, etapa.id) : null,
      selecionada: etapa.id === input.vista,
    };
  });
}

export function resolveCargaIbcVoltar(atual: CargaIbcEtapa): string {
  return atual === "preparacao" ? "/expedicao-ibc" : "/expedicao-ibc/em-viagem";
}
