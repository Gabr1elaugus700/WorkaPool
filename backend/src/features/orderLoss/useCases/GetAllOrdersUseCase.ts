import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";

export class GetAllOrdersUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  async execute() {
    const orders = await this.ordersRepository.getAll();
    return orders;
  }
}
