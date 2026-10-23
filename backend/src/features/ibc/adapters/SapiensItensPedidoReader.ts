import { sqlPool, sqlPoolConnect } from "../../../database/sqlServer";
import { QUERY_ITENS_PEDIDO_POR_NUMERO } from "../../pedidos/queries/pedidosQueries";
import { ItemPedidoSapiens } from "../services/backfillCargaPedidoIbcGrupos";

const TAMANHO_LOTE = 400;

type ItemPedidoRow = {
  NUM_PED: string | number;
  COD_PRO: string | null;
  CODIGO_EMBALAGEM: number | string | null;
};

export class SapiensItensPedidoReader {
  async listItensByNumPed(numPeds: readonly string[]): Promise<ItemPedidoSapiens[]> {
    const unicos = [...new Set(numPeds.map((numPed) => numPed.trim()).filter((numPed) => numPed.length > 0))];
    if (unicos.length === 0) return [];

    await sqlPoolConnect;
    const itens: ItemPedidoSapiens[] = [];

    for (let offset = 0; offset < unicos.length; offset += TAMANHO_LOTE) {
      const lote = unicos.slice(offset, offset + TAMANHO_LOTE);
      const request = sqlPool.request();
      lote.forEach((numPed, index) => {
        const valor = /^\d+$/.test(numPed) ? Number(numPed) : numPed;
        request.input(`numPed${index}`, valor);
      });
      const placeholders = lote.map((_, index) => `@numPed${index}`).join(", ");
      const result = await request.query<ItemPedidoRow>(QUERY_ITENS_PEDIDO_POR_NUMERO(placeholders));

      for (const row of result.recordset) {
        itens.push({
          numPed: String(row.NUM_PED).trim(),
          codPro: String(row.COD_PRO ?? "").trim(),
          codigoEmbalagem: row.CODIGO_EMBALAGEM ?? null,
        });
      }
    }

    return itens;
  }
}
