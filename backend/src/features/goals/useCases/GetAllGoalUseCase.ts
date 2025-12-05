import { Goal, GoalProps } from "../entities/Goal";
import { IGoalsRepository } from "../repositories/IGoalsRepository";
import { PrismaGoalsRepository } from "../repositories/PrismaGoalsRepository";


export class GetAllGoalsUseCase {
  constructor(
    private readonly goalsRepository: IGoalsRepository = new PrismaGoalsRepository()
  ) {}

  async execute(): Promise<Goal[]> {
    const goals = await this.goalsRepository.getAll();
    // Sort goals by product name    
    return goals.sort((a, b) => a.product.localeCompare(b.product));
  }
}