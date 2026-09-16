import { Request, Response } from "express";
import { AppError } from "../../../../utils/AppError";
import { CreateAlocacaoIbcSchema } from "../schemas/CreateAlocacaoIbcSchema";
import { FecharExpedicaoIbcSchema } from "../schemas/FecharExpedicaoIbcSchema";
import {
  IbcCadastroHttpSchemas,
} from "../schemas/IbcCadastroSchema";
import { IbcProdutoHttpSchemas } from "../schemas/IbcProdutoSchema";
import { CreateAlocacaoIbcUseCase } from "../../useCases/CreateAlocacaoIbc.use-case";
import { RemoveAlocacaoIbcUseCase } from "../../useCases/RemoveAlocacaoIbc.use-case";
import { FecharExpedicaoIbcUseCase } from "../../useCases/FecharExpedicaoIbc.use-case";
import { ListCargasExpedicaoUseCase } from "../../useCases/ListCargasExpedicao.use-case";
import { GetCargaExpedicaoDetailUseCase } from "../../useCases/GetCargaExpedicaoDetail.use-case";
import { CreateNovoIbcUseCase } from "../../useCases/CreateNovoIbc.use-case";
import { CreateLoteIbcUseCase } from "../../useCases/CreateLoteIbc.use-case";
import { ListIbcPoolUseCase } from "../../useCases/ListIbcPool.use-case";
import { ListIbcAlertsUseCase } from "../../useCases/ListIbcAlerts.use-case";
import { PatchIbcDataLimiteUseCase } from "../../useCases/PatchIbcDataLimite.use-case";
import { SoftDeleteIbcUseCase } from "../../useCases/SoftDeleteIbc.use-case";
import { IbcCadastroRepository } from "../../repositories/IbcCadastroRepository";
import { IbcProdutoRepository } from "../../repositories/IbcProdutoRepository";
import { createSapiensSaldoIbcErpPort } from "../../adapters/createSapiensSaldoIbcErpPort";
import { ibcSseGateway } from "../../realtime/ibcSseGateway";
import { CreateIbcProdutoUseCase } from "../../useCases/CreateIbcProduto.use-case";
import { ListIbcProdutosUseCase } from "../../useCases/ListIbcProdutos.use-case";
import { UpdateIbcProdutoUseCase } from "../../useCases/UpdateIbcProduto.use-case";
import { ConvertIbcHomologacaoUseCase } from "../../useCases/ConvertIbcHomologacao.use-case";
import { ChangeIbcProdutoUseCase } from "../../useCases/ChangeIbcProduto.use-case";

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

function cadastroRepository(): IbcCadastroRepository {
  return new IbcCadastroRepository();
}

function produtoRepository(): IbcProdutoRepository {
  return new IbcProdutoRepository();
}

export class IbcController {
  static async createNovoIbc(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcCadastroHttpSchemas.createNovo.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dados inválidos para cadastro de IBC",
          code: "IBC_CADASTRO_INVALID_BODY",
          details: parsed.error.format(),
        });
      }

      const useCase = new CreateNovoIbcUseCase(
        cadastroRepository(),
        produtoRepository(),
      );
      const ibc = await useCase.execute({
        dataLimite: parsed.data.dataLimite,
        produtoId: parsed.data.produtoId,
      });
      return res.status(201).json(ibc);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao cadastrar IBC");
    }
  }

  static async createLoteIbc(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcCadastroHttpSchemas.createLote.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dados inválidos para cadastro em lote de IBC",
          code: "IBC_LOTE_INVALID_BODY",
          details: parsed.error.format(),
        });
      }

      const useCase = new CreateLoteIbcUseCase(
        cadastroRepository(),
        produtoRepository(),
        createSapiensSaldoIbcErpPort(),
      );
      const result = await useCase.execute({
        quantidade: parsed.data.quantidade,
        dataLimite: parsed.data.dataLimite,
        numeroNf: parsed.data.numeroNf,
        produtoId: parsed.data.produtoId,
      });
      return res.status(201).json(result);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao cadastrar lote de IBC");
    }
  }

  static async listPool(req: Request, res: Response): Promise<Response> {
    try {
      const incluirBaixados =
        String(req.query.incluirBaixados ?? "").toLowerCase() === "true";
      const useCase = new ListIbcPoolUseCase(cadastroRepository());
      const ibcs = await useCase.execute({ incluirBaixados });
      return res.status(200).json(ibcs);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar pool de IBC");
    }
  }

  static async listAlerts(_req: Request, res: Response): Promise<Response> {
    try {
      const useCase = new ListIbcAlertsUseCase(cadastroRepository());
      const alerts = await useCase.execute();
      return res.status(200).json(alerts);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar alertas de IBC");
    }
  }

  static async patchDataLimite(req: Request, res: Response): Promise<Response> {
    try {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        return res.status(400).json({
          error: "ID do IBC é obrigatório",
          code: "IBC_ID_REQUIRED",
        });
      }

      const parsed = IbcCadastroHttpSchemas.patchDataLimite.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dados inválidos para atualização de data limite",
          code: "IBC_PATCH_INVALID_BODY",
          details: parsed.error.format(),
        });
      }

      const useCase = new PatchIbcDataLimiteUseCase(cadastroRepository());
      const ibc = await useCase.execute({
        id,
        dataLimite: parsed.data.dataLimite,
        identificador: parsed.data.identificador,
      });
      return res.status(200).json(ibc);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao atualizar data limite do IBC");
    }
  }

  static async softDelete(req: Request, res: Response): Promise<Response> {
    try {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        return res.status(400).json({
          error: "ID do IBC é obrigatório",
          code: "IBC_ID_REQUIRED",
        });
      }

      const useCase = new SoftDeleteIbcUseCase(cadastroRepository());
      const ibc = await useCase.execute({ id });
      return res.status(200).json(ibc);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao baixar IBC");
    }
  }

  static streamEvents(req: Request, res: Response): void {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write(": connected\n\n");

    const removeClient = ibcSseGateway.addClient(res);
    req.on("close", removeClient);
  }

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

  static async createProduto(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = IbcProdutoHttpSchemas.create.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dados inválidos para cadastro de produto",
          code: "IBC_PRODUTO_INVALID_BODY",
          details: parsed.error.format(),
        });
      }

      const useCase = new CreateIbcProdutoUseCase(produtoRepository());
      const produto = await useCase.execute(parsed.data);
      return res.status(201).json(produto);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao cadastrar produto de container");
    }
  }

  static async listProdutos(_req: Request, res: Response): Promise<Response> {
    try {
      const useCase = new ListIbcProdutosUseCase(produtoRepository());
      const produtos = await useCase.execute();
      return res.status(200).json(produtos);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao listar produtos de container");
    }
  }

  static async updateProduto(req: Request, res: Response): Promise<Response> {
    try {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        return res.status(400).json({
          error: "ID do produto é obrigatório",
          code: "IBC_PRODUTO_ID_REQUIRED",
        });
      }

      const parsed = IbcProdutoHttpSchemas.update.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Dados inválidos para edição de produto",
          code: "IBC_PRODUTO_INVALID_BODY",
          details: parsed.error.format(),
        });
      }

      const useCase = new UpdateIbcProdutoUseCase(produtoRepository());
      const produto = await useCase.execute({ id, ...parsed.data });
      return res.status(200).json(produto);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao editar produto de container");
    }
  }

  static async convertToNaoHomologado(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        return res.status(400).json({
          error: "ID do IBC é obrigatório",
          code: "IBC_ID_REQUIRED",
        });
      }

      const parsed = IbcCadastroHttpSchemas.convertToNaoHomologado.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Confirmação obrigatória para converter IBC",
          code: "IBC_STATUS_CONFIRMATION_REQUIRED",
          details: parsed.error.format(),
        });
      }

      const actorId = req.user?.id;
      if (!actorId) {
        return res.status(401).json({
          error: "Usuário não autenticado",
          code: "IBC_ACTOR_REQUIRED",
        });
      }

      const useCase = new ConvertIbcHomologacaoUseCase(cadastroRepository());
      const converted = await useCase.execute({
        sourceIbcId: id,
        actorId,
        observation: parsed.data.observacao ?? null,
      });
      return res.status(201).json(converted);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao converter IBC para não homologado");
    }
  }

  static async changeProduto(req: Request, res: Response): Promise<Response> {
    try {
      const id = String(req.params.id ?? "").trim();
      if (!id) {
        return res.status(400).json({
          error: "ID do IBC é obrigatório",
          code: "IBC_ID_REQUIRED",
        });
      }

      const parsed = IbcCadastroHttpSchemas.changeProduto.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Confirmação obrigatória para mudança de produto",
          code: "IBC_PRODUCT_CHANGE_CONFIRMATION_REQUIRED",
          details: parsed.error.format(),
        });
      }

      const actorId = req.user?.id;
      if (!actorId) {
        return res.status(401).json({
          error: "Usuário não autenticado",
          code: "IBC_ACTOR_REQUIRED",
        });
      }

      const useCase = new ChangeIbcProdutoUseCase(
        cadastroRepository(),
        produtoRepository(),
      );
      const converted = await useCase.execute({
        sourceIbcId: id,
        targetProdutoId: parsed.data.produtoId,
        actorId,
        observation: parsed.data.observacao ?? null,
      });
      return res.status(201).json(converted);
    } catch (err: unknown) {
      return respondAppError(res, err, "Erro ao alterar produto do IBC");
    }
  }
}
