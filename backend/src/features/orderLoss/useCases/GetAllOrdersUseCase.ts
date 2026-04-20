import { AppError } from "../../../utils/AppError";
import { paginateArray, PaginationParams } from "../../../utils/Paginate";
import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";

export class GetAllOrdersUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  /**
   * Busca todos os pedidos com motivos de perda
   * @returns Pedidos com motivos de perda
   * @throws AppError - Se não houver pedidos com motivos de perda no banco de dados
   */
  async execute(filters?: PaginationParams){
    const ordersWithLossReasons = await this.ordersRepository.getAllWithLossReasons();

    if (!ordersWithLossReasons) {
      throw new AppError({ message: "Erro ao buscar pedidos com motivos de perda no banco de dados.", statusCode: 500, code: "ERROR_GETTING_ORDERS_WITH_LOSS_REASONS_IN_DATABASE", details: "Erro ao buscar pedidos com motivos de perda no banco de dados." });
    }

    return paginateArray(ordersWithLossReasons, filters);
  }
}
