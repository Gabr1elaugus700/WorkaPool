import type { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import type { GetOverviewCustomerDetailUseCase } from "../../useCases/GetOverviewCustomerDetailUseCase";

export type OverviewCustomerDetailControllerDeps = {
  getDetail: GetOverviewCustomerDetailUseCase;
};

export class OverviewCustomerDetailController {
  constructor(private readonly deps: OverviewCustomerDetailControllerDeps) {}

  getByCustomerCode = async (req: Request, res: Response): Promise<Response> => {
    try {
      const rawCustomerCode = Number(req.params.clienteId);
      if (!Number.isInteger(rawCustomerCode) || rawCustomerCode <= 0) {
        return res.status(400).json({
          error: "clienteId inválido",
          code: "OVERVIEW_CUSTOMER_INVALID_ID",
        });
      }

      const role = req.user?.role;
      if (!role) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const result = await this.deps.getDetail.execute({
        customerCode: rawCustomerCode,
        role,
        codRep: req.user?.codRep,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return this.mapError(res, error);
    }
  };

  private mapError(res: Response, error: unknown): Response {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }

    return res.status(500).json({
      error: "Erro ao buscar detalhes do cliente no Overview",
      code: "INTERNAL_ERROR",
    });
  }
}
