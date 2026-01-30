// ==================== BACKEND ALIGNED TYPES ====================
// Tipos alinhados com o backend em orderLoss feature

export type OrderStatus = 'NEGOTIATING' | 'LOST' | 'WON' | 'CANCELLED';

export type LossReasonCode = 'FREIGHT' | 'PRICE' | 'MARGIN' | 'STOCK' | 'OTHER';

export const lossReasonLabels: Record<LossReasonCode, string> = {
  FREIGHT: 'Frete',
  PRICE: 'Preço',
  MARGIN: 'Margem',
  STOCK: 'Estoque',
  OTHER: 'Outro',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  NEGOTIATING: 'Em Negociação',
  LOST: 'Perdido',
  WON: 'Ganho',
  CANCELLED: 'Cancelado',
};

// ==================== LOSS REASON ====================

export interface LossReasonDetail {
  id: string;
  orderId: string;
  code: LossReasonCode;
  description: string;
  submittedBy: string;
  submittedAt: string; // ISO date string
}

export interface CreateLossReasonDTO {
  orderId: string;
  code: LossReasonCode;
  description: string;
  submittedBy: string;
}

// ==================== ORDER PRODUCT ====================

export interface OrderProduct {
  id: string;
  orderId: string;
  codprod: string;
  description?: string;
  createdAt: string; // ISO date string
}

// ==================== ORDER ====================

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  idUser: string;
  codRep: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface OrderWithDetails extends Order {
  products: OrderProduct[];
  lossReason?: LossReasonDetail;
}

export interface CreateOrderDTO {
  orderNumber: string | number;
  status?: OrderStatus;
  idUser: string;
  codRep: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
}

// ==================== SAPIENS LOST ORDERS ====================

export interface LostOrderFromSapiens {
  DATA: string; // Date ISO string
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

export interface GetLostOrdersFilters {
  codRep?: string;
}

// ==================== AGGREGATED DATA (Frontend computed) ====================

export interface SellerWithOrders {
  sellerId: string;
  sellerName: string;
  sellerCode: number;
  orders: LostOrderFromSapiens[];
  stats: SellerStats;
}

export interface SellerStats {
  totalOrders: number;
  negotiatingOrders: number;
  lostOrders: number;
  totalWeight: number;
  totalValue: number;
  averageMargin: number;
  lostWithoutReason: number;
  negotiatingValue: number;
}

export interface KPIData {
  weightInNegotiation: number;
  averageMargin: number;
  activeNegotiations: number;
  totalOrders: number;
  lostOrders: number;
  totalValue: number;
}

// ==================== LEGACY TYPES (para compatibilidade temporária) ====================
// Manter para não quebrar componentes existentes até refatoração completa

export interface Product {
  id: string;
  name: string;
  quantity: number;
  weight: number; // em kg
  margin: number; // percentual
  freight: number; // valor
  unitPrice: number;
  totalPrice: number;
}

export interface LegacyOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  status: 'negotiating' | 'lost';
  seller: string;
  sellerId: string;
  totalWeight: number; // em kg
  averageMargin: number; // percentual
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
  products: Product[];
  lossReason?: string; // Apenas para pedidos perdidos (versão simplificada)
  lossReasonDetail?: LossReasonDetail; // Estrutura completa com código e justificativa
}

export interface Seller {
  id: string;
  name: string;
  orders: LegacyOrder[];
}

