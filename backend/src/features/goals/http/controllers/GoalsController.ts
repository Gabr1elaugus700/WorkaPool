import { Request, Response } from "express";
import { CreateGoalUseCase } from "../../useCases/CreateGoalUseCase";
import { CreateGoalSchema } from "../schemas/goalSchemas";
import { DeleteGoalUseCase } from "../../useCases/DeleteGoalUseCase";
import { GetAllGoalsUseCase } from "../../useCases/GetAllGoalUseCase";
import { FindByIdUseCase } from "../../useCases/FindByIdUseCase";
import { FindByRepMonthProductUseCase } from "../../useCases/FindByRepMonthProductUseCase";

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

      const service = new CreateGoalUseCase();
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

      const service = new DeleteGoalUseCase();
      await service.execute({ id });
      return res.status(204).send();
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro Interno ao deletar meta';
        return res.status(500).json({ error: message });
    }
  }

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const service = new GetAllGoalsUseCase();
      const goals = await service.execute();
      return res.status(200).json(goals);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro Interno ao buscar metas';
      return res.status(500).json({ error: message });
    }
  }

  static async findById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "ID da meta é obrigatório." });
      }
      const service = new FindByIdUseCase();
      const goal = await service.execute({ id });
      return res.status(200).json(goal);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro Interno ao buscar meta';
      return res.status(500).json({ error: message });
    }
  }

  static async findByRepMonthProduct(req: Request, res: Response): Promise<Response> {
    try {
      const { codRep, monthGoal, cod_grp } = req.query;

      if (!codRep || !monthGoal || !cod_grp) {
        return res.status(400).json({ error: "Parâmetros codRep, monthGoal e cod_grp são obrigatórios." });
      }

      const service = new FindByRepMonthProductUseCase();
      const goal = await service.execute({
        codRep: Number(codRep),
        monthGoal: Number(monthGoal),
        cod_grp: String(cod_grp),
      });

      return res.status(200).json(goal);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro Interno ao buscar meta';
      return res.status(500).json({ error: message });
    }
  }
}