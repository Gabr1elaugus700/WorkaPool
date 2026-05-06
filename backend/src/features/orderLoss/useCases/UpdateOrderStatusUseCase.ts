import { AppError } from "../../../utils/AppError";
import { Order, OrderStatus } from "../entities/Order";
import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";
import { UpdateOrderStatusDTO } from "../http/schemas/orderSchemas";

interface UpdateOrderStatusInput {
  orderId: string;
  data: UpdateOrderStatusDTO;
}

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  async execute({ orderId, data }: UpdateOrderStatusInput): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);

    if (!order) {
      throw new AppError({
        message: "Pedido não encontrado.",
        statusCode: 404,
        code: "ORDER_NOT_FOUND",
        details: { orderId },
      });
    }

    order.status = data.status as OrderStatus;
    order.updatedAt = new Date();

    await this.ordersRepository.update(order);
    return order;
  }
}
