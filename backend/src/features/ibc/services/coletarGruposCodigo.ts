import { CODIGO_EMBALAGEM_IBC } from "../../pedidos/mappers/computePedidoIbcEligibility";

export type LinhaGrupoPedido = {
  codigoEmbalagem?: number | string | null;
  grupoCodigo?: string | null;
};

/**
 * Grupos distintos, na ordem da primeira ocorrência, das linhas envasadas em IBC.
 * 251001 é a embalagem da própria linha do produto, não um item separado do pedido.
 */
export function coletarGruposCodigo(linhas: readonly LinhaGrupoPedido[]): string[] {
  const grupos: string[] = [];
  const vistos = new Set<string>();

  for (const linha of linhas) {
    if (Number(linha.codigoEmbalagem) !== CODIGO_EMBALAGEM_IBC) continue;
    const grupo = linha.grupoCodigo?.trim() ?? "";
    if (grupo.length === 0 || vistos.has(grupo)) continue;
    vistos.add(grupo);
    grupos.push(grupo);
  }

  return grupos;
}
