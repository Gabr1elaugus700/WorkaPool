import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";
import { GetLostOrdersFiltersDTO } from "../http/schemas/orderSchemas";

export class GetLostOrdersUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  async execute(filters?: GetLostOrdersFiltersDTO) {
    const lostOrders = await this.ordersRepository.getLostOrdersFromSapiens(filters);
    
    return lostOrders;
  }
}
