import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

export class GetPedidosFechadosVendedorUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}

  async execute(codRep?: number) {
    const pedidos = await this.pedidosRepository.getPedidos(codRep);
    return pedidos;
  }
}
