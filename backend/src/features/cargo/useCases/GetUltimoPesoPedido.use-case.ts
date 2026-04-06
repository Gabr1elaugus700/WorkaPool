import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

export class GetUltimoPesoPedidoUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}

  async execute(numPed: number) {
    const historico = await this.pedidosRepository.getLastHistoricoPeso(numPed);

    if (!historico) {
      throw new Error(`Histórico do pedido ${numPed} não encontrado.`);
    }

    return historico;
  }
}
