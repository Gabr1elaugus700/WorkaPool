import { Goal, GoalProps } from "../entities/Goal";
import { Goals as PrismaGoal } from "@prisma/client";

export class GoalMapper {
  static toDomain(prismaGoal: PrismaGoal): Goal {
    const props: GoalProps = {
      product: prismaGoal.product,
      productGoal: prismaGoal.productGoal,
      codRep: prismaGoal.codRep,
      monthGoal: prismaGoal.monthGoal,
      yearGoal: prismaGoal.yearGoal,
      averagePrice: prismaGoal.averagePrice,
      cod_grp: prismaGoal.cod_grp ?? undefined,
      createdAt: prismaGoal.createdAt,
      updatedAt: prismaGoal.updatedAt,
    };

    const goal = new Goal(props);

    (goal as any).id = prismaGoal.id; // Atribuir o ID diretamente
    return goal;
  }
}
