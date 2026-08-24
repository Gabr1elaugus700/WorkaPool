import { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import { CreateAlocacaoIbcSchema } from "../schemas/CreateAlocacaoIbcSchema";
import { FecharExpedicaoIbcSchema } from "../schemas/FecharExpedicaoIbcSchema";
import { CreateAlocacaoIbcUseCase } from "../../useCases/CreateAlocacaoIbc.use-case";
import { RemoveAlocacaoIbcUseCase } from "../../useCases/RemoveAlocacaoIbc.use-case";
import { FecharExpedicaoIbcUseCase } from "../../useCases/FecharExpedicaoIbc.use-case";
import { ListCargasExpedicaoUseCase } from "../../useCases/ListCargasExpedicao.use-case";
import { GetCargaExpedicaoDetailUseCase } from "../../useCases/GetCargaExpedicaoDetail.use-case";

function respondAppError(res: Response, err: unknown, fallbackMessage: string): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }
  const message = err instanceof Error ? err.message : fallbackMessage;
  return res.status(500).json({ error: message });
}

export class IbcController {
  static async listCargasExpedicao(
    _req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const useCase = new ListCargasExpedicaoUseCase();
      const result = await useCase.execute();
      return res.status(200).json(result);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar cargas de expedição IBC");
    }
  }

  static async getCargaExpedicaoDetail(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const codCar = Number(req.params.codCar);
      if (!Number.isFinite(codCar)) {
        return res.status(400).json({
          error: "Código da carga inválido.",
          code: "IBC_COD_CAR_INVALID",
        });
      }

      const useCase = new GetCargaExpedicaoDetailUseCase();
      const detail = await useCase.execute({ codCar });
      return res.status(200).json(detail);
    } catch (err: unknown) {
      return respondAppError(
        res,
        err,
        "Erro ao obter detalhe de preparação IBC",
      );
    }
  }

  static async createAlocacao(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = CreateAlocacaoIbcSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dados inválidos para alocação IBC",
          code: "IBC_ALOCACAO_INVALID_BODY",
          details: parsed.error.format(),
        });
      }

      const alocadoPorId = req.user?.id;
      if (!alocadoPorId) {
        return res.status(401).json({
          error: "Usuário não autenticado",
          code: "IBC_ALOCADO_POR_REQUIRED",
        });
      }

      const useCase = new CreateAlocacaoIbcUseCase();
      const result = await useCase.execute({
        ...parsed.data,
        alocadoPorId,
      });

      return res.status(201).json({
        message: "IBC alocado com sucesso",
        alocacao: result.alocacao,
        quantidadeAlocada: result.quantidadeAlocada,
        quantidadeEsperadaTotal: result.quantidadeEsperadaTotal,
      });
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao alocar IBC");
    }
  }

  static async removeAlocacao(req: Request, res: Response): Promise<Response> {
    try {
      const alocacaoId = String(req.params.id ?? "").trim();
      if (!alocacaoId) {
        return res.status(400).json({
          error: "ID da alocação é obrigatório",
          code: "IBC_ALOCACAO_ID_REQUIRED",
        });
      }

      const useCase = new RemoveAlocacaoIbcUseCase();
      const result = await useCase.execute({ alocacaoId });

      return res.status(200).json({
        message: "Alocação removida com sucesso",
        ...result,
      });
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao remover alocação IBC");
    }
  }

  static async fecharExpedicao(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = FecharExpedicaoIbcSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Código da carga é obrigatório",
          code: "IBC_COD_CAR_REQUIRED",
          details: parsed.error.format(),
        });
      }

      const fechadoPorId = req.user?.id;
      if (!fechadoPorId) {
        return res.status(401).json({
          error: "Usuário não autenticado",
          code: "IBC_FECHADO_POR_REQUIRED",
        });
      }

      const useCase = new FecharExpedicaoIbcUseCase();
      const result = await useCase.execute({
        codCar: parsed.data.codCar,
        fechadoPorId,
      });

      return res.status(201).json({
        message: "Expedição IBC fechada com sucesso",
        expedicao: result.expedicao,
        ibcsEmViagem: result.ibcsEmViagem,
      });
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao fechar expedição IBC");
    }
  }
}
