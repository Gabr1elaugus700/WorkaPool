export type OrderStatus = 'negotiating' | 'lost';

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
  lossReason?: string; // Apenas para pedidos perdidos
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
