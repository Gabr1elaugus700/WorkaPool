import { Order } from "../entities/Order";
import { OrderProduct } from "../entities/OrderProduct";
import { LossReason } from "../entities/LossReason";

export interface GetLostOrdersFilters {
  startDate?: string;
  endDate?: string;
  codRep?: string;
}

export interface LostOrderFromSapiens {
  DATA: Date;
  NUMPED: string;
  SITUAÇÃO: string;
  CODREP: number;
  APEREP: string;
  CODCLI: number;
  FANTASIA: string;
  CIDADE: string;
  CODPRO: string;
  PRODUTO: string;
  QTDPED: number;
  PREUNI: number;
  VLRFINAL: number;
  "MARGEM LUCRO": number;
  VLRFRETE: number;
  IPI: number;
  ICMS: number;
}

export interface IOrdersRepository {
  // CRUD básico
  create(order: Order): Promise<void>;
  update(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: number): Promise<Order | null>;
  getAll(): Promise<Order[]>;
  
  // Buscar pedidos perdidos do SAPIENS
  getLostOrdersFromSapiens(filters?: GetLostOrdersFilters): Promise<LostOrderFromSapiens[]>;
  
  // Operações com produtos
  addProduct(product: OrderProduct): Promise<void>;
  getProductsByOrderId(orderId: string): Promise<OrderProduct[]>;
  
  // Operações com motivo de perda
  addLossReason(lossReason: LossReason): Promise<void>;
  getLossReasonByOrderId(orderId: string): Promise<LossReason | null>;
}
