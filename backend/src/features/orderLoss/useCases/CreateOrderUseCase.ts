import { Order, OrderStatus } from "../entities/Order";
import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";
import { CreateOrderDTO } from "../http/schemas/orderSchemas";
import { AppError } from "../../../utils/AppError";

export class CreateOrderUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) { }

  /**
   * Cria um novo pedido
   * @param data - Dados do pedido (orderNumber, status, idUser, codRep)
   * @throws AppError - Se já existir um pedido com esse número
   * @throws AppError - Se o pedido não for criado no banco de dados
   * @returns Pedido criado
   */
  async execute(data: CreateOrderDTO): Promise<Order> {

    const existing = await this.ordersRepository.findByOrderNumber(data.orderNumber);

    if (existing) {
      throw new AppError({ message: "Já existe um pedido com este número.", statusCode: 400, code: "ORDER_ALREADY_EXISTS", details: "Já existe um pedido com este número." });
    }

    const order = new Order({
      ...data,
      status: data.status as OrderStatus,
    });

    await this.ordersRepository.create(order);

    if (!order) {
      throw new AppError({ message: "Erro ao criar pedido no banco de dados.", statusCode: 500, code: "ERROR_CREATING_ORDER_IN_DATABASE", details: "Erro ao criar pedido no banco de dados." });
    }
    return order;
  }
}
