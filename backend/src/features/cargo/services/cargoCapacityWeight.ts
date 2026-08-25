type WeightedItem = {
  peso: number;
};

type WeightedPedido = {
  peso: number;
};

/**
 * Full item-sum weight math for Carga capacity checks.
 * Pedido weight and Carga occupied weight always use every item line.
 */
export const cargoCapacityWeight = {
  pedidoFromItems(items: ReadonlyArray<WeightedItem>): number {
    return items.reduce((sum, item) => sum + Number(item.peso), 0);
  },

  occupiedFromPedidos(pedidos: ReadonlyArray<WeightedPedido>): number {
    return pedidos.reduce((sum, pedido) => sum + Number(pedido.peso), 0);
  },
};
