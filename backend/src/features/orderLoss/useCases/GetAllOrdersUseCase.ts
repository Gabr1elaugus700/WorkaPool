import { IOrdersRepository, OrderWithLossReason } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";

export class GetAllOrdersUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  async execute(): Promise<OrderWithLossReason[]> {
    const ordersWithLossReasons = await this.ordersRepository.getAllWithLossReasons();
    
    return ordersWithLossReasons;
  }
}
