import { Goal, GoalProps } from "../entities/Goal";
import { IGoalsRepository } from "../repositories/IGoalsRepository";
import { PrismaGoalsRepository } from "../repositories/PrismaGoalsRepository";
import { CreateGoalDTO } from "../http/schemas/goalSchemas";

export class CreateGoalUseCase {
    constructor(
      private readonly goalsRepository: IGoalsRepository = new PrismaGoalsRepository()
    ) {}

    async execute(data: CreateGoalDTO): Promise<Goal> {
        
        const existing = await this.goalsRepository.findByRepAndMonthAndYearAndCodGrp({
            codRep: data.codRep,
            monthGoal: data.monthGoal,
            yearGoal: data.yearGoal,
            cod_grp: data.cod_grp,
        });

        if (existing) {
            console.log("Existing goal found:", existing);
            throw new Error("Meta já existe para este vendedor, esse mês e produto.");
        }

        const goal = new Goal(data);

        await this.goalsRepository.create(goal);
        return goal;
    }


}