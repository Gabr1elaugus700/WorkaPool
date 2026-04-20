import { Order } from "../entities/Order";
import { OrderProduct } from "../entities/OrderProduct";
import { LossReason } from "../entities/LossReason";
import { LossReasonCode } from "../entities/Order";
import { PedidoOrderLoss, PedidosSapiensFiltersDTO } from "../../pedidos";
import { PaginationParams } from "../../../utils/Paginate";

// Alias para compatibilidade - usa PedidoOrderLoss como base
export type LostOrderFromSapiens = PedidoOrderLoss;

export interface OrderWithLossReason {
  order: Order;
  lossReason: LossReason | null;
  products: OrderProduct[];
}

export interface IOrdersRepository {
  // CRUD básico
  create(order: Order): Promise<void>;
  update(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: number): Promise<Order | null>;
  getAll(): Promise<Order[]>;
  getAllWithLossReasons(): Promise<OrderWithLossReason[]>;
  
  // Buscar pedidos perdidos do SAPIENS
  getLostOrdersFromSapiens(filters?: PedidosSapiensFiltersDTO): Promise<LostOrderFromSapiens[]>;
  
  // Operações com produtos
  addProduct(product: OrderProduct): Promise<void>;
  getProductsByOrderId(orderId: string): Promise<OrderProduct[]>;
  
  // Operações com motivo de perda
  addLossReason(lossReason: LossReason): Promise<void>;
  getLossReasonByOrderId(orderId: string): Promise<LossReason | null>;
  updateLossReason(
    orderId: string,
    code: LossReasonCode,
    description: string,
    submittedBy: string,
  ): Promise<LossReason>;
}
