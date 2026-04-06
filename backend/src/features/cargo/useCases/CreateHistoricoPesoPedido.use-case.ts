import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

export class CreateHistoricoPesoPedidoUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}

  async execute(numPed: number, cargaId: string, peso: number) {
    const input = await this.pedidosRepository.getLastHistoricoPeso(numPed);

    if (!input) {
      throw new Error(`Histórico do pedido ${numPed} não encontrado.`);
    }

    await this.pedidosRepository.createHistoricoPeso(numPed, cargaId, peso);
  }
}
