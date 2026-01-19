import { PrismaClient } from "@prisma/client";
import { Goal } from "../entities/Goal";
import { IGoalsRepository } from "./IGoalsRepository";
import { GoalMapper } from "../mappers/GoalMapper";

const prisma = new PrismaClient();

export class PrismaGoalsRepository implements IGoalsRepository {
  async create(goal: Goal): Promise<void> {
    await prisma.goals.create({
      data: {
        id: goal.id,
        product: goal.product,
        productGoal: goal.productGoal,
        codRep: goal.codRep,
        monthGoal: goal.monthGoal,
        yearGoal: goal.yearGoal,
        averagePrice: goal.averagePrice,
        cod_grp: goal.cod_grp ?? null,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      },
    });
  }

  async update(goal: Goal): Promise<void> {
    await prisma.goals.update({
      where: { id: goal.id },
      data: {
        productGoal: goal.productGoal,
        monthGoal: goal.monthGoal,
        yearGoal: goal.yearGoal,
        averagePrice: goal.averagePrice,
        cod_grp: goal.cod_grp ?? null,
        updatedAt: goal.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.goals.delete({
      where: { id },
    });
  }

  async getAll(): Promise<Goal[]> {
    const records = await prisma.goals.findMany();
    return records.map(GoalMapper.toDomain);
  }

  async findById(id: string): Promise<Goal | null> {
    const record = await prisma.goals.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return GoalMapper.toDomain(record);
  }

  async findByRepMonthProduct(params: {
    codRep: number;
    monthGoal: number;
    cod_grp?: string;
  }): Promise<Goal | null> {
    const record = await prisma.goals.findFirst({
      where: {
        codRep: params.codRep,
        monthGoal: params.monthGoal,
        cod_grp: params.cod_grp ?? undefined,
      },
    });

    if (!record) {
      return null;
    }

    return GoalMapper.toDomain(record);
  }

  async findByRepAndMonthAndYearAndCodGrp(params: {
    codRep: number,
    monthGoal: number,
    yearGoal: number,
    cod_grp?: string
  }): Promise<Goal | null> {
    const record = await prisma.goals.findFirst({
      where: {
        codRep: params.codRep,
        monthGoal: params.monthGoal,
        yearGoal: params.yearGoal,
        cod_grp: params.cod_grp ?? undefined,
      },
    });
    
    if (!record) {
      return null;
    }

    return record ? GoalMapper.toDomain(record) : null;
  }
}
