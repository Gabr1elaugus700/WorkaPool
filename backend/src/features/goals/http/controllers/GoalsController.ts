import { Request, Response } from "express";
import { CreateGoalService } from "../../services/CreateGoalService";
import { CreateGoalSchema } from "../schemas/goalSchemas";
import { DeleteGoalService } from "../../services/DeleteGoalService";

export class GoalsController {
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = CreateGoalSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid data",
          details: parsed.error.format(),
        });
      }

      const service = new CreateGoalService();
      const goal = await service.execute(parsed.data);

      return res.status(201).json({
        id: goal.id,
        product: goal.product,
        productGoal: goal.productGoal,
        codRep: goal.codRep,
        monthGoal: goal.monthGoal,
        yearGoal: goal.yearGoal,
        averagePrice: goal.averagePrice,
        cod_grp: goal.cod_grp,
        createAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro Interno ao criar meta';
        return res.status(500).json({ error: message });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "ID da meta é obrigatório." });
      }

      const service = new DeleteGoalService();
      await service.execute({ id });
      return res.status(204).send();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro Interno ao deletar meta';
        return res.status(500).json({ error: message });
    }
  }
}
