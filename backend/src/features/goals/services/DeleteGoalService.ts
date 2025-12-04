import { Goal, GoalProps } from "../entities/Goal";
import { IGoalsRepository } from "../repositories/IGoalsRepository";
import { PrismaGoalsRepository } from "../repositories/PrismaGoalsRepository";

export type DeleteGoalDTO = {
    id: string;
};

export class DeleteGoalService {
    constructor(
      private readonly goalsRepository: IGoalsRepository = new PrismaGoalsRepository()
    ) {}

    async execute({ id }: DeleteGoalDTO): Promise<void> {
        const existing = await this.goalsRepository.findById(id);
        
        if (!existing) {
            throw new Error("Meta não encontrada.");
        }

        await this.goalsRepository.delete(id);
    }
}