import { Request, Response } from "express";
import { GetLostOrdersUseCase } from "../../useCases/GetLostOrdersUseCase";
import { CreateOrderUseCase } from "../../useCases/CreateOrderUseCase";
import { UpdateOrderStatusUseCase } from "../../useCases/UpdateOrderStatusUseCase";
import { AddLossReasonUseCase } from "../../useCases/AddLossReasonUseCase";
import { UpdateLossReasonUseCase } from "../../useCases/UpdateLossReasonUseCase";
import { GetAllOrdersUseCase } from "../../useCases/GetAllOrdersUseCase";
import { GetOrderByIdUseCase } from "../../useCases/GetOrderByIdUseCase";
import { AppError } from "../../../../utils/AppError";
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  AddLossReasonSchema,
  UpdateLossReasonSchema,
  GetLostOrdersFiltersSchema,
} from "../schemas/orderSchemas";
import { PaginationQuerySchema } from "../../../../schemas/paginationSchema";

export class OrdersController {
  private static isPrivilegedRole(role?: string): boolean {
    return role === "ADMIN" || role === "GERENTE_DPTO" || role === "LOGISTICA";
  }
  /**
   * GET /api/orders/lost-sapiens
   * Busca pedidos perdidos do SAPIENS (sitped = 5)
   */
  static async getLostOrdersFromSapiens(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = GetLostOrdersFiltersSchema.safeParse(req.query);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Filtros inválidos",
          details: parsed.error.format(),
          code: "INVALID_FILTERS",
        });
      }

      const currentUser = req.user;
      if (!currentUser) {
        throw new AppError({ message: "Usuário não autenticado", statusCode: 401, code: "USER_NOT_AUTHENTICATED", details: "Usuário não autenticado" });
      }

      const normalizedFilters = { ...parsed.data };
      if (currentUser.role === "VENDAS") {
        if (!currentUser.codRep) {
          throw new AppError({ message: "Usuário sem código de vendedor vinculado", statusCode: 403, code: "USER_NO_COD_REP", details: "Usuário sem código de vendedor vinculado" });
        }
        normalizedFilters.codRep = String(currentUser.codRep);
      }

      const useCase = new GetLostOrdersUseCase();
      const lostOrders = await useCase.execute(normalizedFilters);

      return res.status(200).json(lostOrders);
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({
        error: "Erro ao buscar pedidos perdidos do SAPIENS",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * POST /api/orders
   * Cria um novo pedido no banco local (PostgreSQL)
   */
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = CreateOrderSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError({ message: "Dados inválidos", statusCode: 400, code: "INVALID_DATA", details: parsed.error.format() });
      }

      const useCase = new CreateOrderUseCase();
      const order = await useCase.execute(parsed.data);

      return res.status(201).json({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        idUser: order.idUser,
        codRep: order.codRep,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    } catch (err) {
      // console.error('❌ [OrdersController.create] Erro:', err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({ error: "Erro interno ao criar pedido", code: "INTERNAL_ERROR" });
    }
  }

  /**
   * GET /api/orders
   * Lista todos os pedidos do banco local
   */
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = PaginationQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError({ message: "Filtros inválidos", statusCode: 400, code: "INVALID_FILTERS", details: parsed.error.format() });
      }
      
      const useCase = new GetAllOrdersUseCase();
      const orders = await useCase.execute(parsed.data);

      
      return res.status(200).json(orders);
      
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({ error: "Erro ao buscar pedidos", code: "INTERNAL_ERROR" });
    }
  }

  /**
   * GET /api/orders/:id
   * Busca um pedido por ID com produtos e motivo de perda
   */
  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "ID do pedido é obrigatório." });
      }

      const useCase = new GetOrderByIdUseCase();
      const result = await useCase.execute({ id });

      return res.status(200).json(result);
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({ error: "Erro ao buscar pedido", code: "INTERNAL_ERROR" });
    }
  }

  static async getPerSellerOrders(req: Request, res: Response): Promise<Response> {

    try {
      const parsed = GetLostOrdersFiltersSchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError({ message: "Filtros inválidos", statusCode: 400, code: "INVALID_FILTERS", details: parsed.error.format() });
      }
      const normalizedFilters = { ...parsed.data };

      const currentUser = req.user;
      if (!currentUser) {
        throw new AppError({ message: "Usuário não autenticado", statusCode: 401, code: "USER_NOT_AUTHENTICATED", details: "Usuário não autenticado" });
      }
      if (currentUser.role === "VENDAS") {
        if (!currentUser.codRep) {
          throw new AppError({ message: "Usuário sem código de vendedor vinculado", statusCode: 403, code: "USER_NO_COD_REP", details: "Usuário sem código de vendedor vinculado" });
        }
        normalizedFilters.codRep = String(currentUser.codRep);
      }

      const useCase = new GetLostOrdersUseCase();
      const lostOrders = await useCase.execute(normalizedFilters);

      return res.status(200).json(lostOrders);
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({ error: "Erro ao buscar pedidos do vendedor" });
    }
  }
  /**
   * PATCH /api/orders/:id/status
   * Atualiza o status de um pedido
   */
  static async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      if (!id) {
        throw new AppError({ message: "ID do pedido é obrigatório.", statusCode: 400, code: "ORDER_ID_REQUIRED", details: "ID do pedido é obrigatório." });
      }
      if (!currentUser) {
        throw new AppError({ message: "Usuário não autenticado", statusCode: 401, code: "USER_NOT_AUTHENTICATED", details: "Usuário não autenticado" });
      }

      if (!OrdersController.isPrivilegedRole(currentUser.role) && currentUser.role !== "VENDAS") {
        throw new AppError({ message: "Acesso negado", statusCode: 403, code: "ACCESS_DENIED", details: "Acesso negado" });
      }

      const parsed = UpdateOrderStatusSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError({ message: "Dados inválidos", statusCode: 400, code: "INVALID_DATA", details: parsed.error.format() });
      }

      const useCase = new UpdateOrderStatusUseCase();
      const order = await useCase.execute({
        orderId: id,
        data: parsed.data,
      });

      return res.status(200).json({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        idUser: order.idUser,
        codRep: order.codRep,
        updatedAt: order.updatedAt,
      });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao atualizar status do pedido" });
    }
  }

  /**
   * POST /api/orders/loss-reason
   * Adiciona motivo de perda a um pedido e marca como perdido
   */
  static async addLossReason(req: Request, res: Response): Promise<Response> {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        throw new AppError({
          message: "Usuário não autenticado",
          statusCode: 401,
          code: "USER_NOT_AUTHENTICATED",
          details: "Usuário não autenticado"
        });
      }

      const parsed = AddLossReasonSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError({ message: "Dados inválidos", statusCode: 400, code: "INVALID_DATA", details: parsed.error.format() });
      }

      if (
        currentUser.role === "VENDAS" &&
        currentUser.codRep &&
        parsed.data.submittedBy !== String(currentUser.codRep)
      ) {
        throw new AppError({ message: "Vendedor só pode registrar motivo de seus próprios pedidos	", statusCode: 403, code: "SELLER_CAN_ONLY_REGISTER_REASON_FOR_SELF", details: "Vendedor só pode registrar motivo para si próprio" });
      }

      const useCase = new AddLossReasonUseCase();
      const lossReason = await useCase.execute(parsed.data);

      return res.status(201).json({
        id: lossReason.id,
        orderId: lossReason.orderId,
        code: lossReason.code,
        description: lossReason.description,
        submittedBy: lossReason.submittedBy,
        submittedAt: lossReason.submittedAt,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }
      return res.status(500).json({ error: "Erro ao adicionar motivo de perda" });
    }
  }

  /**
   * PUT /api/orders/loss-reason
   * Atualiza motivo de perda SOMENTE se já existir e se estiver dentro da janela de 7 dias.
   */
  static async updateLossReason(req: Request, res: Response): Promise<Response> {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        throw new AppError({ message: "Usuário não autenticado", statusCode: 401, code: "USER_NOT_AUTHENTICATED", details: "Usuário não autenticado" });
      }

      const parsed = UpdateLossReasonSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError({ message: "Dados inválidos", statusCode: 400, code: "INVALID_DATA", details: parsed.error.format() });
      }

      if (
        currentUser.role === "VENDAS" &&
        currentUser.codRep &&
        parsed.data.submittedBy !== String(currentUser.codRep)
      ) {
        throw new AppError({ message: "Vendedor só pode atualizar motivo de seus próprios pedidos", statusCode: 403, code: "SELLER_CAN_ONLY_UPDATE_REASON_FOR_SELF", details: "Vendedor só pode atualizar motivo para si próprio" });
      }

      const useCase = new UpdateLossReasonUseCase();
      const lossReason = await useCase.execute(parsed.data);

      return res.status(200).json({
        id: lossReason.id,
        orderId: lossReason.orderId,
        code: lossReason.code,
        description: lossReason.description,
        submittedBy: lossReason.submittedBy,
        submittedAt: lossReason.submittedAt,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
          details: err.details,
        });
      }

      return res.status(500).json({
        error: "Erro ao atualizar motivo de perda",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
