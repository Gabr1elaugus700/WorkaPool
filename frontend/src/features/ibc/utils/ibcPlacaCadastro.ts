import type { ListaIbcProdutoConfig } from "../services/ibcProdutoConfigService";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";

const COR = /^#[0-9A-F]{6}$/;
const SIGLA = /^[A-Z]{1,2}$/;
const UNIVERSAL = "Universal (lavado entre usos)";

export type GrupoPlacaOpcao = { grupoCodigo: string; nome: string; sigla: string; corHex: string };
export type NomeProdutoIbc = { id: string; nome: string };

function corDe(value: string | null | undefined): string | null {
  const cor = value?.trim().toUpperCase() ?? "";
  return COR.test(cor) ? cor : null;
}

export const ibcPlacaCadastro = {
  universalOpcao: UNIVERSAL,
  cor: corDe,
  grupos(lista: ListaIbcProdutoConfig | null | undefined): GrupoPlacaOpcao[] {
    return (lista?.grupos ?? []).flatMap((grupo) => {
      const sigla = grupo.sigla?.trim().toUpperCase() ?? "";
      const corHex = corDe(grupo.corHex);
      if (!grupo.configurado || !grupo.encontradoNoSapiens || !corHex || !SIGLA.test(sigla)) return [];
      return [{ grupoCodigo: grupo.grupoCodigo, nome: grupo.grupoDescricao?.trim() || grupo.grupoCodigo, sigla, corHex }];
    });
  },
  universalCor(lista: ListaIbcProdutoConfig | null | undefined): string | null {
    return lista?.universal.configurado ? corDe(lista.universal.corHex) : null;
  },
  nomes(lista: ListaIbcProdutoConfig | null | undefined): NomeProdutoIbc[] {
    const nomes: NomeProdutoIbc[] = [];
    if (lista?.universal.id) nomes.push({ id: lista.universal.id, nome: "Universal" });
    for (const grupo of lista?.grupos ?? []) {
      if (grupo.id) nomes.push({ id: grupo.id, nome: grupo.grupoDescricao?.trim() || grupo.grupoCodigo });
    }
    return nomes;
  },
  naoHomologado(ibc: Pick<IbcCadastroDTO, "homologado" | "prefixo" | "identificador">): boolean {
    if (typeof ibc.homologado === "boolean") return !ibc.homologado;
    return (ibc.prefixo || (/^([A-Z]+)\d+$/.exec(ibc.identificador)?.[1] ?? "")).startsWith("NH");
  },
  escolha(homologado: boolean, grupoCodigo: string, grupos: readonly GrupoPlacaOpcao[], universalCor: string | null) {
    const grupo = grupos.find((item) => item.grupoCodigo === grupoCodigo);
    if (grupo) return { prefixo: `${homologado ? "HM" : "NH"}${grupo.sigla}`, corHex: grupo.corHex, rotulo: `${grupo.nome} (${grupo.sigla})` };
    if (!grupoCodigo && !homologado && universalCor) return { prefixo: "NH", corHex: universalCor, rotulo: UNIVERSAL };
    return null;
  },
  aviso(homologado: boolean, grupoCodigo: string, grupos: readonly GrupoPlacaOpcao[], universalCor: string | null): string | null {
    if (grupoCodigo) return grupos.some((item) => item.grupoCodigo === grupoCodigo) ? null : "Grupo sem configuração de placa ou fora do catálogo";
    if (homologado) return "Container homologado exige grupo de produto";
    return universalCor ? null : "Container universal sem configuração de placa";
  },
};
