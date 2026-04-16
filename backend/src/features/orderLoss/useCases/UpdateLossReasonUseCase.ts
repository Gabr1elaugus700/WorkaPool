import { LossReason } from "../entities/LossReason";
import { LossReasonCode, OrderStatus } from "../entities/Order";
import { IOrdersRepository } from "../repositories/IOrdersRepository";
import { OrdersRepository } from "../repositories/OrdersRepository";
import { UpdateLossReasonDTO } from "../http/schemas/orderSchemas";

export class UpdateLossReasonUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository = new OrdersRepository(),
  ) {}

  async execute(data: UpdateLossReasonDTO): Promise<LossReason> {
    const order = await this.ordersRepository.findById(data.orderId);
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    // Spec: só permite update quando o pedido está LOST
    if (order.status !== OrderStatus.LOST) {
      throw new Error("ORDER_NOT_LOST");
    }

    // Spec: não permitir update sem justificativa pré-existente
    const existingLossReason = await this.ordersRepository.getLossReasonByOrderId(data.orderId);
    if (!existingLossReason) {
      throw new Error("LOSS_REASON_NOT_FOUND");
    }

    // Spec: janela de 7 dias (idade <= 7 dias permitido)
    const msIn7Days = 7 * 24 * 60 * 60 * 1000;
    const ageMs = Date.now() - existingLossReason.submittedAt.getTime();
    if (ageMs > msIn7Days) {
      throw new Error("LOSS_REASON_EXPIRED");
    }

    // Spec: preservar submittedAt original; atualizar apenas code/description/submittedBy
    return this.ordersRepository.updateLossReason(
      data.orderId,
      data.code as LossReasonCode,
      data.description,
      data.submittedBy,
    );
  }
}

