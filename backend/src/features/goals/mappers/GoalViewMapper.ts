import { Goal } from "../entities/Goal";

export class GoalViewMapper {
  static toHTTP(goal: Goal) {
    return {
      id: goal.id,
      product: goal.product,
      productGoal: goal.productGoal,
      codRep: goal.codRep,
      monthGoal: goal.monthGoal,
      yearGoal: goal.yearGoal,
      averagePrice: goal.averagePrice,
      cod_grp: goal.cod_grp,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }
}
