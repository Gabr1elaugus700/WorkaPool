import { Request, Response } from "express";
import { GetCargaByIdUseCase } from "../../useCases/GetCargaById.use-case";
import { UpdatePedidoCargaUseCase } from "../../useCases/UpdatePedidoCarga.use-case";
import { CreateCargaUseCase } from "../../useCases/CreateCarga.use-case";
import { GetPedidosFechadosVendedorUseCase } from "../../useCases/GetPedidosFechadosVendedor.use-case";
import { CreateCargaSchema, getCargasFechadasQuerySchema } from "../schemas/cargoSchema";
import { GetAllCargasUseCase } from "../../useCases/GetAllCargas.use-case";
import { UpdateCargaSituacaoUseCase } from "../../useCases/UpdateCargaSituacao.use-case";
import { SituacaoCarga } from "../../entities/Carga";
import { UpdateCargaUseCase } from "../../useCases/UpdateCarga.use-case";
import { GetPedidosCargaUseCase } from "../../useCases/GetPedidosCarga.use-case";
import { CloseCargaUseCase } from "../../useCases/CloseCarga.use-case";
import { GetCargasFechadasUseCase } from "../../useCases/GetCargasFechadas.use-case";
import { AppError } from "../../../../utils/AppError";

export class CargoController {
  static async createCarga(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = CreateCargaSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.errors,
          details: parsed.error.format(),
        });
      }

      const createCargaUseCase = new CreateCargaUseCase();
      const cargo = await createCargaUseCase.execute(parsed.data);
      return res.status(201).json(cargo);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      const message =
        err instanceof Error ? err.message : "Erro interno ao criar carga";
      return res
        .status(500)
        .json({ error: message, code: "INTERNAL_ERROR" });
    }
  }
  static async getCargaById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "ID da carga é obrigatório." });
      }
      const getCargaByIdUseCase = new GetCargaByIdUseCase();
      const carga = await getCargaByIdUseCase.execute(Number(id));
      return res.json(carga);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      const message =
        err instanceof Error ? err.message : "Erro interno ao buscar carga";
      return res
        .status(500)
        .json({ error: message, code: "INTERNAL_ERROR" });
    }
  }

  static async closeCarga(req: Request, res: Response): Promise<Response> {
    try {      
      const { codCar } = req.body;

      if (codCar == null) {
        throw new AppError({ message: "Código da carga é obrigatório para fechar a carga.", statusCode: 400, code: "MISSING_CAR_CODE", details: "Código da carga é obrigatório para fechar a carga." });
      }

      // console.log(`🔵 [Controller] Recebida requisição para fechar carga ${codCar}`);

      const closeCargaUseCase = new CloseCargaUseCase();
      const result = await closeCargaUseCase.execute(Number(codCar));
      
      // console.log(`✅ [Controller] Carga ${codCar} fechada com sucesso. ${result.pedidosSalvos} pedidos salvos.`);
      
      return res.status(200).json({
        message: "Carga fechada com sucesso",
        carga: result.carga,
        pedidosSalvos: result.pedidosSalvos,
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res
        .status(500)
        .json({ error: "Erro ao fechar carga", code: "INTERNAL_ERROR" });
    }
  }

  static async updatePedido(req: Request, res: Response): Promise<Response> {
    try {
      const { numPed } = req.params;
      const { codCar, posCar } = req.body;
      if (!numPed || codCar == null || posCar == null) {
        return res.status(400).json({
          error: "Dados obrigatórios ausentes para atualização de carga.",
        });
      }
      const updatePedidoCargaUseCase = new UpdatePedidoCargaUseCase();
      await updatePedidoCargaUseCase.execute(
        Number(numPed),
        Number(codCar),
        Number(posCar),
      );
      return res
        .status(200)
        .json({ message: "Pedido atualizado com sucesso." });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      const message =
        err instanceof Error
          ? err.message
          : "Erro interno ao atualizar pedido";
      return res
        .status(500)
        .json({ error: message, code: "INTERNAL_ERROR" });
    }
  }

  static async getPedidos(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      // Suporta tanto /pedidos-fechados/:codRep quanto /pedidos-fechados?codRep=X
      const codRepParam = req.params.codRep;
      const codRepQuery = req.query.codRep;
      
      const codRep = codRepParam || codRepQuery;
      
      const getPedidosFechadosVendedorUseCase = new GetPedidosFechadosVendedorUseCase();
      const pedidos = await getPedidosFechadosVendedorUseCase.execute(
        codRep ? Number(codRep) : undefined
      );
      
      return res.json(pedidos);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      const message =
        err instanceof Error
          ? err.message
          : "Erro interno ao buscar pedidos fechados";
      return res
        .status(500)
        .json({ error: message, code: "INTERNAL_ERROR" });
    }
  }

  static async getCargas(req: Request, res: Response): Promise<Response> {
    try {
      const situacao = req.query.situacao;

      // Converter para array se vier múltiplos valores
      const situacoes = Array.isArray(situacao)
        ? situacao.map((s) => String(s).toUpperCase())
        : situacao
          ? [String(situacao).toUpperCase()]
          : undefined;

      const getAllCargasUseCase = new GetAllCargasUseCase();
      const cargas = await getAllCargasUseCase.execute(situacoes);

      return res.json(cargas);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res
        .status(500)
        .json({ error: "Erro ao buscar cargas", code: "INTERNAL_ERROR" });
    }
  }

  static async updateSituacao(req: Request, res: Response): Promise<Response> {
    try {
      const { codCar } = req.params;
      const { situacao } = req.body;
      const parsedCodCar = Number(codCar);

      if (!codCar || Number.isNaN(parsedCodCar)) {
        throw new AppError({ message: "Código da carga inválido.", statusCode: 400, code: "INVALID_CAR_CODE", details: "Código da carga inválido." });
      }

      const updateSituacaoSchema = CreateCargaSchema.pick({ situacao: true });
      const parsed = updateSituacaoSchema.safeParse({ situacao });

      if (!parsed.success) {
        throw new AppError({ message: "Dados inválidos para atualização de situação.", statusCode: 400, code: "INVALID_DATA", details: parsed.error.format() });
      }

      const updateCargaSituacaoUseCase = new UpdateCargaSituacaoUseCase();
      await updateCargaSituacaoUseCase.execute(
        parsedCodCar,
        parsed.data.situacao! as SituacaoCarga,
      );
      return res
        .status(200)
        .json({ message: "Situação atualizada com sucesso." });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({
        error: "Erro ao atualizar situação",
        code: "INTERNAL_ERROR",
      });
    }
  }

  static async updateCarga(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const parsed = CreateCargaSchema.safeParse(req.body);
      
      if (!parsed.success) {
        throw new AppError({ message: "Dados inválidos para atualização de carga.", statusCode: 400, code: "INVALID_DATA", details: parsed.error.format() });
      }

      const updateCargaUseCase = new UpdateCargaUseCase();
      const cargo = await updateCargaUseCase.execute(
        id,
        parsed.data,
      );
      return res.status(200).json(cargo);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({
        error: "Erro ao atualizar carga",
        code: "INTERNAL_ERROR",
      });
    }
  }

  static async updatePedidoCarga(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { numPed } = req.params;
      const { codCar, posCar } = req.body;

      if (!numPed || codCar == null || posCar == null) {
        throw new AppError({ message: "Dados obrigatórios ausentes para atualização de carga.", statusCode: 400, code: "MISSING_REQUIRED_DATA", details: "Dados obrigatórios ausentes para atualização de carga." });
      }

      const updatePedidoCargaUseCase = new UpdatePedidoCargaUseCase();
      await updatePedidoCargaUseCase.execute(
        Number(numPed),
        Number(codCar),
        Number(posCar),
      );
      
      return res.status(200).json({ message: "Pedido atualizado com sucesso." });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({
        error: "Erro ao atualizar pedido",
        code: "INTERNAL_ERROR",
      });
    }
  }

  static async getPedidosPorCarga(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { codCar } = req.params;
      const { codRep } = req.query;

      if (!codCar) {
        return res
          .status(400)
          .json({ error: "Código da carga é obrigatório." });
      }

      const getPedidosCargaUseCase = new GetPedidosCargaUseCase();
      let pedidos = await getPedidosCargaUseCase.execute(Number(codCar));

      // Filtrar por vendedor SE fornecido (para visualização)
      if (codRep && Number(codRep) !== 999) {
        pedidos = pedidos.filter((p) => p.codRep === Number(codRep));
      }

      return res.json(pedidos);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      const message =
        err instanceof Error
          ? err.message
          : "Erro interno ao buscar pedidos da carga";
      return res
        .status(500)
        .json({ error: message, code: "INTERNAL_ERROR" });
    }
  }

  static async getCargasFechadas(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const parsed = getCargasFechadasQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.errors,
          details: parsed.error.format(),
        });
      }
      const params = parsed.data;
      console.log(`🔵 [Controller] Buscando cargas fechadas`);

      const getCargasFechadasUseCase = new GetCargasFechadasUseCase();
      const cargasFechadas = await getCargasFechadasUseCase.execute(params);


      return res.json(cargasFechadas);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({
        error: "Erro ao buscar cargas fechadas",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
