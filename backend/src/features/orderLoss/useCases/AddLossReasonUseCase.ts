import { LossReason } from "../entities/LossReason";
import { LossReasonCode } from "../entities/Order";
import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";
import { AddLossReasonDTO } from "../http/schemas/orderSchemas";
import { AppError } from "../../../utils/AppError";

export class AddLossReasonUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  /**
   * Adiciona um motivo de perda a um pedido
   * @param data - Dados do motivo de perda (orderId, code, description, submittedBy - código do vendedor)
   * @throws AppError - Se o pedido não for encontrado
   * @throws AppError - Se já existir um motivo de perda para este pedido
   * @throws AppError - Se o motivo de perda não for criado
   * @throws AppError - Se o motivo de perda não for salvo no banco de dados
   * @returns Motivo de perda criado
   */
  async execute(data: AddLossReasonDTO): Promise<LossReason> {
    const order = await this.ordersRepository.findById(data.orderId);

    if (!order) {
      throw new AppError({ message: "Pedido não encontrado.", statusCode: 404, code: "ORDER_NOT_FOUND", details: "Pedido não encontrado." });
    }

    // Verificar se já existe um motivo de perda para este pedido
    const existing = await this.ordersRepository.getLossReasonByOrderId(data.orderId);

    if (existing) {
      throw new AppError({ message: "Já existe um motivo de perda registrado para este pedido.", statusCode: 400, code: "LOSS_REASON_ALREADY_EXISTS", details: "Já existe um motivo de perda registrado para este pedido." }  );
    }

    const lossReason = new LossReason({
      orderId: data.orderId,
      code: data.code as LossReasonCode,
      description: data.description,
      submittedBy: data.submittedBy,
    });

    // Atualizar status do pedido para LOST
    order.markAsLost();
    await this.ordersRepository.update(order);

    // Adicionar motivo de perda
    await this.ordersRepository.addLossReason(lossReason);
    
    return lossReason;
  }
}
