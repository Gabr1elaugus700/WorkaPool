import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";

export class GetWeightPedidoUseCase {
  constructor(
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}

  async execute(numPed: number) {
    const weightPedido = await this.pedidosRepository.getPedidoWeight(numPed);

    if (!weightPedido) {
      throw new AppError({
        message: `Peso do pedido ${numPed} não encontrado.`,
        statusCode: 404,
        code: "CARGO_PESO_PEDIDO_NOT_FOUND",
        details: { numPed },
      });
    }

    return weightPedido;
  }
}