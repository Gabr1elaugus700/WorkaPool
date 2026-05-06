import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";

export class CreateHistoricoPesoPedidoUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}

  async execute(numPed: number, cargaId: string, peso: number) {
    const input = await this.pedidosRepository.getLastHistoricoPeso(numPed);

    if (!input) {
      throw new AppError({
        message: `Histórico do pedido ${numPed} não encontrado.`,
        statusCode: 404,
        code: "CARGO_HISTORICO_PESO_NOT_FOUND",
        details: { numPed },
      });
    }

    await this.pedidosRepository.createHistoricoPeso(numPed, cargaId, peso);
  }
}
