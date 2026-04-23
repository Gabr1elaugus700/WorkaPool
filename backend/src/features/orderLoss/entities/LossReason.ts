import { v4 as uuid } from "uuid";
import { LossReasonCode } from "./Order";

export interface LossReasonProps {
  id?: string;
  orderId: string;
  code: LossReasonCode;
  description: string;
  submittedBy: string;
  submittedAt?: Date;
}

export class LossReason {
  public readonly id: string;
  public readonly orderId: string;
  public code: LossReasonCode;
  public description: string;
  public submittedBy: string;
  public readonly submittedAt: Date;

  constructor({
    id,
    orderId,
    code,
    description,
    submittedBy,
    submittedAt = new Date(),
  }: LossReasonProps) {
    this.id = id || uuid();
    this.orderId = orderId;
    this.code = code;
    this.description = description;
    this.submittedBy = submittedBy;
    this.submittedAt = submittedAt;


  }
}
