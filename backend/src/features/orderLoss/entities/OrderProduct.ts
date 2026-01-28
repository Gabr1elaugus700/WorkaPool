import { v4 as uuid } from "uuid";

export interface OrderProductProps {
  id?: string;
  orderId: string;
  codprod: string;
  description?: string;
  createdAt?: Date;
}

export class OrderProduct {
  public readonly id: string;
  public readonly orderId: string;
  public codprod: string;
  public description?: string;
  public readonly createdAt: Date;

  constructor({
    id,
    orderId,
    codprod,
    description,
    createdAt = new Date(),
  }: OrderProductProps) {
    this.id = id || uuid();
    this.orderId = orderId;
    this.codprod = codprod;
    this.description = description;
    this.createdAt = createdAt;
  }
}
