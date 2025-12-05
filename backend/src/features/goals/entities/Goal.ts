import { uuid } from "uuidv4";

export interface GoalProps {
  product: string;
  productGoal: number;
  codRep: number;
  monthGoal: number;
  yearGoal: number;
  averagePrice: number;
  cod_grp?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Goal {
  public readonly id: string;
  public readonly product: string;
  public readonly codRep: number;
  public readonly cod_grp?: string;

  public productGoal: number;
  public monthGoal: number;
  public yearGoal: number;
  public averagePrice: number;

  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor({
    product,
    productGoal,
    codRep,
    monthGoal,
    yearGoal,
    averagePrice,
    cod_grp,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: GoalProps) {
    this.id = uuid();
    this.product = product.toUpperCase();
    this.productGoal = productGoal;
    this.codRep = codRep;
    this.monthGoal = monthGoal;
    this.yearGoal = yearGoal;
    this.averagePrice = averagePrice;
    this.cod_grp = cod_grp;

    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  updateGoal(newGoal: number): void {
    if (newGoal <= 0) throw new Error("Meta inválida");
    this.productGoal = newGoal;
    this.updatedAt = new Date();
  }

  updateAveragePrice(newPrice: number): void {
    if (newPrice <= 0) throw new Error("Preço inválido");
    this.averagePrice = newPrice;
    this.updatedAt = new Date();
  }
}
