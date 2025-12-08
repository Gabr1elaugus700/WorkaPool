import { Goal, GoalProps } from "../entities/Goal";
import { IGoalsRepository } from "../repositories/IGoalsRepository";
import { PrismaGoalsRepository } from "../repositories/PrismaGoalsRepository";

export type FindByRepMonthYearDTO = {
  codRep: number;
  monthGoal: number;
  yearGoal: number;
};

export class FindByRepMonthYearCodGrpUseCase {
  constructor(
    private readonly goalsRepository: IGoalsRepository = new PrismaGoalsRepository()
  ) {}

  async execute({ codRep, monthGoal, yearGoal }: FindByRepMonthYearDTO): Promise<Goal> {
    const existingGoal = await this.goalsRepository.findByRepAndMonthAndYearAndCodGrp({
      codRep,
      monthGoal,
      yearGoal,
    });

    if (!existingGoal) {
      throw new Error("Meta não encontrada.");
    }

    return existingGoal;
  }
}
