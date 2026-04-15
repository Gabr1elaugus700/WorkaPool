import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";

interface GetOrderByIdInput {
  id: string;
}

export class GetOrderByIdUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  async execute({ id }: GetOrderByIdInput) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new Error("Pedido não encontrado.");
    }

    // Buscar produtos e motivo de perda
    const products = await this.ordersRepository.getProductsByOrderId(id);
    const lossReason = await this.ordersRepository.getLossReasonByOrderId(id);

    return {
      order,
      products,
      lossReason,
    };
  }
}
