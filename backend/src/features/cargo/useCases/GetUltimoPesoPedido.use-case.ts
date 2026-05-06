import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";

export class GetUltimoPesoPedidoUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}

  async execute(numPed: number) {
    const historico = await this.pedidosRepository.getLastHistoricoPeso(numPed);

    if (!historico) {
      throw new AppError({
        message: `Histórico do pedido ${numPed} não encontrado.`,
        statusCode: 404,
        code: "CARGO_HISTORICO_PESO_NOT_FOUND",
        details: { numPed },
      });
    }

    return historico;
  }
}
