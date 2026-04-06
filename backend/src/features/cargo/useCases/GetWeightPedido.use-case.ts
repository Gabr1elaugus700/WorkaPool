import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

export class GetWeightPedidoUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}

  async execute(numPed: number) {
    const weightPedido = await this.pedidosRepository.getPedidoWeight(numPed);

    if (!weightPedido) {
      throw new Error(`Peso do pedido ${numPed} não encontrado.`);
    }

    return weightPedido;
  }
}