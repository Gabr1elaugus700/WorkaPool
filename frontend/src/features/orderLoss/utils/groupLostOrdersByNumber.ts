import type { LostOrderFromSapiens } from "../types/orderLoss.types";
import { normalizeOrderNumberKey } from "./orderNumberKey";

export interface GroupedLostOrderRow {
  numped: string;
  items: LostOrderFromSapiens[];
  firstItem: LostOrderFromSapiens;
  totalValue: number;
}

/**
 * Agrupa linhas do Sapiens (uma por item de pedido) pelo número do pedido.
 */
export function groupLostOrdersByNumber(
  orders: LostOrderFromSapiens[],
): GroupedLostOrderRow[] {
  const grouped = new Map<string, LostOrderFromSapiens[]>();

  orders.forEach((order) => {
    const key = normalizeOrderNumberKey(order.NUMPED);
    if (!key) return;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(order);
  });

  return Array.from(grouped.entries()).map(([numped, items]) => ({
    numped,
    items,
    firstItem: items[0],
    totalValue: items.reduce((sum, item) => sum + item.VLRFINAL, 0),
  }));
}
