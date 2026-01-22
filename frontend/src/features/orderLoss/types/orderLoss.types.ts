export type OrderStatus = 'negotiating' | 'lost';

export type LossReasonCode = 'freight' | 'price' | 'margin' | 'stock' | 'other';

export interface LossReasonDetail {
  code: LossReasonCode;
  description: string;
  submittedAt: Date;
}

export const lossReasonLabels: Record<LossReasonCode, string> = {
  freight: 'Frete',
  price: 'Preço',
  margin: 'Margem',
  stock: 'Estoque',
  other: 'Outro',
};

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

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  status: OrderStatus;
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
  orders: Order[];
}

export interface KPIData {
  weightInNegotiation: number;
  averageMargin: number;
  activeNegotiations: number;
}
