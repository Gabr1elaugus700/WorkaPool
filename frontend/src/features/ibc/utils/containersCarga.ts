import type {
  ContainerPaletaDTO,
  ContainersCargaDTO,
  PlacaGrupoPaletaDTO,
} from "../types/ibcExpedicao.types";

export type SecaoContainersCarga = {
  tipo: "grupo" | "universal" | "nao-homologado";
  grupoCodigo: string | null;
  sigla: string | null;
  corHex: string | null;
  containers: ContainerPaletaDTO[];
};

export type ContainersVisiveis<T> = {
  visiveis: T[];
  restante: T[];
};

function secaoGrupo(
  grupo: PlacaGrupoPaletaDTO,
  containers: ContainerPaletaDTO[],
): SecaoContainersCarga {
  return {
    tipo: "grupo",
    grupoCodigo: grupo.grupoCodigo,
    sigla: grupo.sigla,
    corHex: grupo.corHex,
    containers,
  };
}

function agruparDisponiveis(paleta: ContainersCargaDTO): SecaoContainersCarga[] {
  const porGrupo = new Map<string, ContainerPaletaDTO[]>();
  const universais: ContainerPaletaDTO[] = [];
  const naoHomologados: ContainerPaletaDTO[] = [];

  for (const container of paleta.disponiveis) {
    if (container.universal) {
      universais.push(container);
      continue;
    }
    if (!container.homologado) {
      naoHomologados.push(container);
      continue;
    }
    if (container.grupoCodigo == null) continue;
    const lista = porGrupo.get(container.grupoCodigo) ?? [];
    lista.push(container);
    porGrupo.set(container.grupoCodigo, lista);
  }

  const secoes: SecaoContainersCarga[] = [];
  for (const grupo of paleta.grupos) {
    const containers = porGrupo.get(grupo.grupoCodigo);
    if (containers == null || containers.length === 0) continue;
    secoes.push(secaoGrupo(grupo, containers));
  }
  if (universais.length > 0) {
    secoes.push({
      tipo: "universal",
      grupoCodigo: null,
      sigla: null,
      corHex: null,
      containers: universais,
    });
  }
  if (naoHomologados.length > 0) {
    secoes.push({
      tipo: "nao-homologado",
      grupoCodigo: null,
      sigla: null,
      corHex: null,
      containers: naoHomologados,
    });
  }
  return secoes;
}

function limitarVisiveis<T>(lista: readonly T[], limite: number): ContainersVisiveis<T> {
  const corte = Math.max(0, limite);
  return {
    visiveis: lista.slice(0, corte),
    restante: lista.slice(corte),
  };
}

function filtrarPorCodigo(
  lista: readonly ContainerPaletaDTO[],
  termo: string,
): ContainerPaletaDTO[] {
  const busca = termo.trim().toLowerCase();
  if (busca.length === 0) return [...lista];
  return lista.filter((container) => container.identificador.toLowerCase().includes(busca));
}

export const containersCarga = {
  agruparDisponiveis,
  limitarVisiveis,
  filtrarPorCodigo,
};
