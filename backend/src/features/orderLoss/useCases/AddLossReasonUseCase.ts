import { LossReason } from "../entities/LossReason";
import { LossReasonCode } from "../entities/Order";
import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";
import { AddLossReasonDTO } from "../http/schemas/orderSchemas";

export class AddLossReasonUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository()
  ) {}

  async execute(data: AddLossReasonDTO): Promise<LossReason> {
    // Verificar se o pedido existe
    const order = await this.ordersRepository.findById(data.orderId);

    if (!order) {
      throw new Error("Pedido não encontrado.");
    }

    // Verificar se já existe um motivo de perda para este pedido
    const existing = await this.ordersRepository.getLossReasonByOrderId(data.orderId);

    if (existing) {
      throw new Error("Já existe um motivo de perda registrado para este pedido.");
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
