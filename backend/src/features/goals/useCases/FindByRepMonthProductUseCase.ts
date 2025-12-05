import { Goal, GoalProps } from "../entities/Goal";
import { IGoalsRepository } from "../repositories/IGoalsRepository";
import { PrismaGoalsRepository } from "../repositories/PrismaGoalsRepository";

export type FindByRepMonthProductDTO = {
  codRep: number;
  monthGoal: number;
  cod_grp: string;
};

export class FindByRepMonthProductUseCase {
  constructor(
    private readonly goalsRepository: IGoalsRepository = new PrismaGoalsRepository()
  ) {}

  async execute({ codRep, monthGoal, cod_grp }: FindByRepMonthProductDTO): Promise<Goal> {
    const existingGoal = await this.goalsRepository.findByRepMonthProduct({
      codRep,
      monthGoal,
      cod_grp,
    });

    if (!existingGoal) {
      throw new Error("Meta não encontrada.");
    }

    return existingGoal;
  }
}
