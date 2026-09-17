import type { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import type { GetOverviewCustomerDetailUseCase } from "../../useCases/GetOverviewCustomerDetailUseCase";
import type { GetOverviewCustomerMonthlyEvolutionUseCase } from "../../useCases/GetOverviewCustomerMonthlyEvolutionUseCase";
import type { GetOverviewCustomerRecentCommercialMotionUseCase } from "../../useCases/GetOverviewCustomerRecentCommercialMotionUseCase";
import type { GetOverviewCustomerPurchasedProductsUseCase } from "../../useCases/GetOverviewCustomerPurchasedProductsUseCase";
import type { ListOverviewCustomersUseCase } from "../../useCases/ListOverviewCustomersUseCase";

export type OverviewCustomerDetailControllerDeps = {
  getDetail: GetOverviewCustomerDetailUseCase;
  listCustomers: ListOverviewCustomersUseCase;
  getMonthlyEvolution: GetOverviewCustomerMonthlyEvolutionUseCase;
  getRecentCommercialMotion: GetOverviewCustomerRecentCommercialMotionUseCase;
  getPurchasedProducts: GetOverviewCustomerPurchasedProductsUseCase;
};

export class OverviewCustomerDetailController {
  constructor(private readonly deps: OverviewCustomerDetailControllerDeps) {}

  list = async (req: Request, res: Response): Promise<Response> => {
    try {
      const role = req.user?.role;
      if (!role) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const rawPage = req.query.page;
      const page = parsePage(rawPage);

      const search = typeof req.query.search === "string" ? req.query.search : undefined;

      const result = await this.deps.listCustomers.execute({
        role,
        codRep: req.user?.codRep,
        search,
        page,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return this.mapError(res, error);
    }
  };

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

  getMonthlyEvolutionByCustomerCode = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
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

      const result = await this.deps.getMonthlyEvolution.execute({
        customerCode: rawCustomerCode,
        role,
        codRep: req.user?.codRep,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return this.mapError(res, error);
    }
  };

  getPurchasedProductsByCustomerCode = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
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

      const result = await this.deps.getPurchasedProducts.execute({
        customerCode: rawCustomerCode,
        role,
        codRep: req.user?.codRep,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return this.mapError(res, error);
    }
  };

  getRecentCommercialMotionByCustomerCode = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
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

      const result = await this.deps.getRecentCommercialMotion.execute({
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

function parsePage(rawPage: Request["query"]["page"]): number {
  if (typeof rawPage !== "string") {
    return 1;
  }

  const parsed = Number.parseInt(rawPage, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 1;
  }
  return parsed;
}
