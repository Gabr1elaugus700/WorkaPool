import { v4 as uuid } from "uuid";

export enum OrderStatus {
  NEGOTIATING = "NEGOTIATING",
  LOST = "LOST",
  WON = "WON",
  CANCELLED = "CANCELLED"
}

export enum LossReasonCode {
  FREIGHT = "FREIGHT",
  PRICE = "PRICE",
  MARGIN = "MARGIN",
  STOCK = "STOCK",
  OTHER = "OTHER"
}

export interface OrderProps {
  id?: string;
  orderNumber: string;
  status: OrderStatus;
  codRep: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  public readonly id: string;
  public orderNumber: string;
  public status: OrderStatus;
  public codRep: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor({
    id,
    orderNumber,
    status,
    codRep,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: OrderProps) {
    this.id = id || uuid();
    this.orderNumber = orderNumber;
    this.status = status;
    this.codRep = codRep;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public markAsLost(): void {
    this.status = OrderStatus.LOST;
    this.updatedAt = new Date();
  }

  public markAsWon(): void {
    this.status = OrderStatus.WON;
    this.updatedAt = new Date();
  }

  public markAsCancelled(): void {
    this.status = OrderStatus.CANCELLED;
    this.updatedAt = new Date();
  }
}
