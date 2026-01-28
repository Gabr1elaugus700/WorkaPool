import { Order, OrderStatus } from "../entities/Order";
import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";
import { CreateOrderDTO } from "../http/schemas/orderSchemas";

export class CreateOrderUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  async execute(data: CreateOrderDTO): Promise<Order> {
    // Verificar se já existe um pedido com esse número
    const existing = await this.ordersRepository.findByOrderNumber(data.orderNumber);

    if (existing) {
      throw new Error("Já existe um pedido com este número.");
    }

    const order = new Order({
      ...data,
      status: data.status as OrderStatus,
    });

    await this.ordersRepository.create(order);
    return order;
  }
}
