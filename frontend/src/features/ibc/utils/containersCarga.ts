import type { ContainerCargaDTO, ContainersCargaDTO } from "../types/ibcExpedicao.types";
import { ibcPlacaCadastro } from "./ibcPlacaCadastro";

export type SecaoPaletaTipo = "grupo" | "universal" | "naoHomologado";

export type SecaoPaleta = {
  chave: string;
  tipo: SecaoPaletaTipo;
  titulo: string;
  corHex: string | null;
  itens: ContainerCargaDTO[];
};

export type PaletaContainers = {
  naCarga: ContainerCargaDTO[];
  secoes: SecaoPaleta[];
};

export type PaletaVisivel = {
  secoes: SecaoPaleta[];
  ocultos: number;
};

function porIdentificador(a: ContainerCargaDTO, b: ContainerCargaDTO): number {
  return a.identificador.localeCompare(b.identificador, "pt-BR", { numeric: true });
}

function tituloGrupo(grupoCodigo: string, sigla: string | null): string {
  return sigla ? `${grupoCodigo} · ${sigla}` : grupoCodigo;
}

/** Vinculados na faixa; livres por grupo, depois universal, depois não homologados. */
function montar(dto: ContainersCargaDTO): PaletaContainers {
  const naCarga = dto.itens.filter((item) => item.alocacaoId != null).sort(porIdentificador);
  const livres = dto.itens.filter((item) => item.alocacaoId == null).sort(porIdentificador);
  const homologados = livres.filter((item) => item.homologado);

  const secoes: SecaoPaleta[] = [];
  for (const grupo of dto.gruposPermitidos) {
    const itens = homologados.filter((item) => !item.universal && item.grupoCodigo === grupo.grupoCodigo);
    if (itens.length === 0) continue;
    secoes.push({
      chave: `grupo:${grupo.grupoCodigo}`,
      tipo: "grupo",
      titulo: tituloGrupo(grupo.grupoCodigo, grupo.sigla ?? itens[0].sigla),
      corHex: ibcPlacaCadastro.cor(grupo.corHex ?? itens[0].corHex),
      itens,
    });
  }

  const universais = homologados.filter((item) => item.universal);
  if (universais.length > 0) {
    secoes.push({
      chave: "universal",
      tipo: "universal",
      titulo: "Universal",
      corHex: ibcPlacaCadastro.cor(universais[0].corHex),
      itens: universais,
    });
  }

  const naoHomologados = livres.filter((item) => !item.homologado);
  if (naoHomologados.length > 0) {
    secoes.push({
      chave: "nao-homologado",
      tipo: "naoHomologado",
      titulo: "Não homologados",
      corHex: null,
      itens: naoHomologados,
    });
  }

  return { naCarga, secoes };
}

/** Corta as seções para caber `limite` chips no total, na ordem das seções. */
function limitar(secoes: readonly SecaoPaleta[], limite: number): PaletaVisivel {
  let restante = Math.max(0, limite);
  let ocultos = 0;
  const visiveis: SecaoPaleta[] = [];
  for (const secao of secoes) {
    const itens = secao.itens.slice(0, restante);
    ocultos += secao.itens.length - itens.length;
    restante -= itens.length;
    if (itens.length > 0) visiveis.push({ ...secao, itens });
  }
  return { secoes: visiveis, ocultos };
}

function filtrar(secoes: readonly SecaoPaleta[], termo: string): SecaoPaleta[] {
  const busca = termo.trim().toUpperCase();
  if (!busca) return [...secoes];
  return secoes.flatMap((secao) => {
    const itens = secao.itens.filter((item) => item.identificador.toUpperCase().includes(busca));
    return itens.length > 0 ? [{ ...secao, itens }] : [];
  });
}

function rotuloGrupo(item: ContainerCargaDTO): string {
  if (item.universal) return "universal";
  return item.grupoCodigo ? `grupo ${item.grupoCodigo}` : "sem grupo";
}

export const containersCarga = { montar, limitar, filtrar, rotuloGrupo };
