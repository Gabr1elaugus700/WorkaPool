import type { UserRole } from "../types/roles.types";

type WeightedItem = {
  peso: number;
};

type WeightedPedido = {
  peso: number;
};

type MayAddParams = {
  role: UserRole | undefined;
  occupiedWeight: number;
  pedidoWeight: number;
  pesoMaximo: number;
};

const PRIVILEGED_ROLES: ReadonlySet<UserRole> = new Set([
  "ADMIN",
  "LOGISTICA",
  "GERENTE_DPTO",
]);

/**
 * Full item-sum weight math for Carga capacity UX checks.
 * Mirrors backend capacity rules; backend remains authoritative.
 */
export const cargoCapacity = {
  pedidoFromItems(items: ReadonlyArray<WeightedItem>): number {
    return items.reduce((sum, item) => sum + Number(item.peso), 0);
  },

  occupiedFromPedidos(pedidos: ReadonlyArray<WeightedPedido>): number {
    return pedidos.reduce((sum, pedido) => sum + Number(pedido.peso), 0);
  },

  mayAddPedido({
    role,
    occupiedWeight,
    pedidoWeight,
    pesoMaximo,
  }: MayAddParams): boolean {
    if (role && PRIVILEGED_ROLES.has(role)) {
      return true;
    }

    return occupiedWeight + pedidoWeight <= pesoMaximo;
  },
};
