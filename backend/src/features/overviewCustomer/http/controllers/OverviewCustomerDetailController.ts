import type { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import type { GetOverviewCustomerDetailUseCase } from "../../useCases/GetOverviewCustomerDetailUseCase";
import type { GetOverviewCustomerMonthlyEvolutionUseCase } from "../../useCases/GetOverviewCustomerMonthlyEvolutionUseCase";
import type { GetOverviewCustomerRecentCommercialMotionUseCase } from "../../useCases/GetOverviewCustomerRecentCommercialMotionUseCase";
import type { GetOverviewCustomerPurchasedProductsUseCase } from "../../useCases/GetOverviewCustomerPurchasedProductsUseCase";
import type { GetOverviewCustomerAbcGroupsUseCase } from "../../useCases/GetOverviewCustomerAbcGroupsUseCase";
import type { GetOverviewCustomerGroupAnaliseUseCase } from "../../useCases/GetOverviewCustomerGroupAnaliseUseCase";
import type { GetOverviewCustomerGroupGanhosUseCase } from "../../useCases/GetOverviewCustomerGroupGanhosUseCase";
import type { GetOverviewCustomerGroupQuotesUseCase } from "../../useCases/GetOverviewCustomerGroupQuotesUseCase";
import type { ListOverviewCustomersUseCase } from "../../useCases/ListOverviewCustomersUseCase";

export type OverviewCustomerDetailControllerDeps = {
  getDetail: GetOverviewCustomerDetailUseCase;
  listCustomers: ListOverviewCustomersUseCase;
  getMonthlyEvolution: GetOverviewCustomerMonthlyEvolutionUseCase;
  getRecentCommercialMotion: GetOverviewCustomerRecentCommercialMotionUseCase;
  getPurchasedProducts: GetOverviewCustomerPurchasedProductsUseCase;
  getAbcGroups: GetOverviewCustomerAbcGroupsUseCase;
  getGroupGanhos: GetOverviewCustomerGroupGanhosUseCase;
  getGroupAnalise: GetOverviewCustomerGroupAnaliseUseCase;
  getGroupQuotes: GetOverviewCustomerGroupQuotesUseCase;
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

  getAbcGroupsByCustomerCode = async (
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

      const result = await this.deps.getAbcGroups.execute({
        customerCode: rawCustomerCode,
        role,
        codRep: req.user?.codRep,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return this.mapError(res, error);
    }
  };

  getGroupGanhosByCustomerCode = async (
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

      const grupoCodigo = parseGrupoCodigo(req.params.grupoCodigo);
      if (!grupoCodigo) {
        return res.status(400).json({
          error: "grupoCodigo inválido",
          code: "OVERVIEW_CUSTOMER_INVALID_GROUP",
        });
      }

      const role = req.user?.role;
      if (!role) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const result = await this.deps.getGroupGanhos.execute({
        customerCode: rawCustomerCode,
        grupoCodigo,
        role,
        codRep: req.user?.codRep,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return this.mapError(res, error);
    }
  };

  getGroupAnaliseByCustomerCode = async (
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

      const grupoCodigo = parseGrupoCodigo(req.params.grupoCodigo);
      if (!grupoCodigo) {
        return res.status(400).json({
          error: "grupoCodigo inválido",
          code: "OVERVIEW_CUSTOMER_INVALID_GROUP",
        });
      }

      const role = req.user?.role;
      if (!role) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const result = await this.deps.getGroupAnalise.execute({
        customerCode: rawCustomerCode,
        grupoCodigo,
        role,
        codRep: req.user?.codRep,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      return this.mapError(res, error);
    }
  };

  getGroupQuotesByCustomerCode = async (
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

      const grupoCodigo = parseGrupoCodigo(req.params.grupoCodigo);
      if (!grupoCodigo) {
        return res.status(400).json({
          error: "grupoCodigo inválido",
          code: "OVERVIEW_CUSTOMER_INVALID_GROUP",
        });
      }

      const role = req.user?.role;
      if (!role) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const productCode = parseOptionalProductCode(req.query.codPro);
      const reveal = parseOptionalReveal(req.query.reveal);

      const result = await this.deps.getGroupQuotes.execute({
        customerCode: rawCustomerCode,
        grupoCodigo,
        productCode,
        reveal,
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

function parseGrupoCodigo(rawGrupoCodigo: string | undefined): string | null {
  if (typeof rawGrupoCodigo !== "string") {
    return null;
  }
  const trimmed = rawGrupoCodigo.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalProductCode(
  rawProductCode: Request["query"]["codPro"],
): string | undefined {
  if (typeof rawProductCode !== "string") {
    return undefined;
  }
  const trimmed = rawProductCode.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseOptionalReveal(
  rawReveal: Request["query"]["reveal"],
): boolean {
  if (typeof rawReveal !== "string") {
    return false;
  }
  const normalized = rawReveal.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
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
