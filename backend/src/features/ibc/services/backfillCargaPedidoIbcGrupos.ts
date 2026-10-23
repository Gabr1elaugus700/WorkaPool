import { coletarGruposCodigo } from "./coletarGruposCodigo";

export type FotoPedidoIbcBackfill = {
  id: string;
  numPed: string;
  gruposCodigo: readonly string[];
  viagemFechada: boolean;
};

export type ItemPedidoSapiens = {
  numPed: string;
  codPro: string;
  codigoEmbalagem: number | string | null;
};

export type CargaPedidoIbcGruposBackfillPorts = {
  listFotos(): Promise<FotoPedidoIbcBackfill[]>;
  saveGrupos(id: string, gruposCodigo: string[]): Promise<void>;
  listItensByNumPed(numPeds: readonly string[]): Promise<ItemPedidoSapiens[]>;
  listGruposByProduto(codigos: readonly string[]): Promise<ReadonlyMap<string, string>>;
};

function fotosElegiveis(fotos: readonly FotoPedidoIbcBackfill[]): FotoPedidoIbcBackfill[] {
  return fotos.filter((foto) => !foto.viagemFechada && foto.gruposCodigo.length === 0);
}

function itensPorPedido(itens: readonly ItemPedidoSapiens[]): Map<string, ItemPedidoSapiens[]> {
  const porPedido = new Map<string, ItemPedidoSapiens[]>();
  for (const item of itens) {
    const numPed = item.numPed.trim();
    const linhas = porPedido.get(numPed);
    if (linhas) linhas.push(item);
    else porPedido.set(numPed, [item]);
  }
  return porPedido;
}

/**
 * Preenche `gruposCodigo` das fotos de viagem ainda aberta.
 * Viagem fechada e foto que já tem grupo não são gravadas. Rodar de novo não altera o que já foi preenchido.
 */
export async function backfillCargaPedidoIbcGrupos(
  ports: CargaPedidoIbcGruposBackfillPorts,
): Promise<{ atualizadas: number }> {
  const elegiveis = fotosElegiveis(await ports.listFotos());
  if (elegiveis.length === 0) return { atualizadas: 0 };

  const itens = await ports.listItensByNumPed(elegiveis.map((foto) => foto.numPed));
  const codigos = [...new Set(itens.map((item) => item.codPro.trim()).filter((codigo) => codigo.length > 0))];
  const gruposPorProduto = await ports.listGruposByProduto(codigos);
  const porPedido = itensPorPedido(itens);

  let atualizadas = 0;
  for (const foto of elegiveis) {
    const linhas = (porPedido.get(foto.numPed.trim()) ?? []).map((item) => ({
      codigoEmbalagem: item.codigoEmbalagem,
      grupoCodigo: gruposPorProduto.get(item.codPro.trim()) ?? null,
    }));
    const gruposCodigo = coletarGruposCodigo(linhas);
    if (gruposCodigo.length === 0) continue;
    await ports.saveGrupos(foto.id, gruposCodigo);
    atualizadas += 1;
  }

  return { atualizadas };
}
