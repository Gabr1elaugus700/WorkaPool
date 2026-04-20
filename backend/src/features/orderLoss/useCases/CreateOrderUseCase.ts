import { Order, OrderStatus } from "../entities/Order";
import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";
import { CreateOrderDTO } from "../http/schemas/orderSchemas";
import { AppError } from "../../../utils/AppError";

export class CreateOrderUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) { }

  async execute(data: CreateOrderDTO): Promise<Order> {
    // console.log('🔶 [CreateOrderUseCase] Executando...');
    // console.log('🔶 [CreateOrderUseCase] Dados recebidos:', JSON.stringify(data, null, 2));

    // Verificar se já existe um pedido com esse número
    const existing = await this.ordersRepository.findByOrderNumber(data.orderNumber);

    if (existing) {
      // console.warn('⚠️ [CreateOrderUseCase] Pedido já existe:', data.orderNumber);
      throw new AppError({ message: "Já existe um pedido com este número.", statusCode: 400, code: "ORDER_ALREADY_EXISTS", details: "Já existe um pedido com este número." });
    }

    // console.log('🔶 [CreateOrderUseCase] Criando entidade Order...');
    const order = new Order({
      ...data,
      status: data.status as OrderStatus,
    });

    // console.log('🔶 [CreateOrderUseCase] Order criado:', order);
    // console.log('🔶 [CreateOrderUseCase] Salvando no banco...');

    await this.ordersRepository.create(order);

    // console.log('✅ [CreateOrderUseCase] Pedido salvo com sucesso:', order.id);
    return order;
  }
}
