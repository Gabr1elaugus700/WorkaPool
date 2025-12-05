import { Goal } from "../entities/Goal";

export interface IGoalsRepository {
  create(goal: Goal): Promise<void>;
  update(goal: Goal): Promise<void>;
  delete(id: string): Promise<void>;
  getAll(): Promise<Goal[]>;
  findById(id: string): Promise<Goal | null>;
  findByRepMonthProduct(params:{
    codRep: number;
    monthGoal: number;
    cod_grp?: string;
  }): Promise<Goal | null>;
  findByRepAndMonthAndYear(
    codRep: number,
    monthGoal: number,
    yearGoal: number
  ): Promise<Goal | null>;
}