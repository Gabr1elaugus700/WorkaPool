import { apiFetchJson } from "@/lib/apiFetch";

export type IbcProdutoUniversalConfig = { id: string | null; corHex: string | null; configurado: boolean; emUso: boolean };

export type IbcProdutoGrupoConfig = {
  id: string | null; grupoCodigo: string; grupoDescricao: string | null; sigla: string | null;
  corHex: string | null; configurado: boolean; emUso: boolean; encontradoNoSapiens: boolean;
};

export type ListaIbcProdutoConfig = { universal: IbcProdutoUniversalConfig; grupos: IbcProdutoGrupoConfig[] };

export type SaveIbcProdutoConfigInput =
  | { tipo: "universal"; corHex: string }
  | { tipo: "grupo"; grupoCodigo: string; sigla: string; corHex: string };

export const ibcProdutoConfigService = {
  list: (): Promise<ListaIbcProdutoConfig> => apiFetchJson<ListaIbcProdutoConfig>("/api/ibc/produtos"),
  save: (input: SaveIbcProdutoConfigInput): Promise<IbcProdutoUniversalConfig | IbcProdutoGrupoConfig> =>
    input.tipo === "universal"
      ? apiFetchJson("/api/ibc/produtos/universal", { method: "PUT", body: JSON.stringify({ corHex: input.corHex }) })
      : apiFetchJson(`/api/ibc/produtos/grupos/${encodeURIComponent(input.grupoCodigo)}`, {
          method: "PUT",
          body: JSON.stringify({ sigla: input.sigla, corHex: input.corHex }),
        }),
};
