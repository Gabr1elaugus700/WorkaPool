import { Goal, GoalProps } from "../entities/Goal";
import { IGoalsRepository } from "../repositories/IGoalsRepository";
import { PrismaGoalsRepository } from "../repositories/PrismaGoalsRepository";

export type findByIdDTO = {
  id: string;
};

export class FindByIdUseCase {
  constructor(
    private readonly goalsRepository: IGoalsRepository = new PrismaGoalsRepository()
  ) {}

  async execute({ id }: findByIdDTO): Promise<Goal> {
    const existingGoal = await this.goalsRepository.findById(id);

    if (!existingGoal) {
      throw new Error("Meta não encontrada.");
    }

    return existingGoal;
  }
}
