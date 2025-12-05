import { Goal, GoalProps } from "../entities/Goal";
import { IGoalsRepository } from "../repositories/IGoalsRepository";
import { PrismaGoalsRepository } from "../repositories/PrismaGoalsRepository";

export type FindByRepMonthYearDTO = {
  codRep: number;
  monthGoal: number;
  yearGoal: number;
};

export class FindByRepMonthYearUseCase {
  constructor(
    private readonly goalsRepository: IGoalsRepository = new PrismaGoalsRepository()
  ) {}

  async execute({ codRep, monthGoal, yearGoal }: FindByRepMonthYearDTO): Promise<Goal[]> {
    const existingGoal = await this.goalsRepository.findByRepAndMonthAndYear({
      codRep,
      monthGoal,
      yearGoal,
    });

    if (!existingGoal) {
      throw new Error("Meta não encontrada.");
    }

    return existingGoal.sort((a, b) => b.productGoal.valueOf() - a.productGoal.valueOf());
  }
}
