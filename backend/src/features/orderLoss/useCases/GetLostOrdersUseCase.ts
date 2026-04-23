import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";
import { GetLostOrdersFiltersDTO } from "../http/schemas/orderSchemas";
import { paginateArray } from "../../../utils/Paginate";

export class GetLostOrdersUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  /**
   * Busca pedidos perdidos do SAPIENS
   * @param codRep - Código do representante/vendedor
   * @param startDate - Data inicial
   * @param endDate - Data final
   * @returns Pedidos perdidos do SAPIENS
   */
  async execute(filters?: GetLostOrdersFiltersDTO) {
    const lostOrders = await this.ordersRepository.getLostOrdersFromSapiens(filters);
    
    return paginateArray(lostOrders, filters);
  }
}
