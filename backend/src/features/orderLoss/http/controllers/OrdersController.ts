import { Request, Response } from "express";
import { GetLostOrdersUseCase } from "../../useCases/GetLostOrdersUseCase";
import { CreateOrderUseCase } from "../../useCases/CreateOrderUseCase";
import { UpdateOrderStatusUseCase } from "../../useCases/UpdateOrderStatusUseCase";
import { AddLossReasonUseCase } from "../../useCases/AddLossReasonUseCase";
import { GetAllOrdersUseCase } from "../../useCases/GetAllOrdersUseCase";
import { GetOrderByIdUseCase } from "../../useCases/GetOrderByIdUseCase";
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  AddLossReasonSchema,
  GetLostOrdersFiltersSchema,
} from "../schemas/orderSchemas";

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
        });
      }

      const currentUser = req.user;
      if (!currentUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const normalizedFilters = { ...parsed.data };
      if (currentUser.role === "VENDAS") {
        if (!currentUser.codRep) {
          return res.status(403).json({ error: "Usuário sem código de vendedor vinculado" });
        }
        normalizedFilters.codRep = String(currentUser.codRep);
      }

      const useCase = new GetLostOrdersUseCase();
      const lostOrders = await useCase.execute(normalizedFilters);

      return res.status(200).json(lostOrders);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar pedidos perdidos do SAPIENS" });
    }
  }

  /**
   * POST /api/orders
   * Cria um novo pedido no banco local (PostgreSQL)
   */
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      // console.log('🔷 [OrdersController.create] Requisição recebida');
      // console.log('🔷 [OrdersController.create] Body:', JSON.stringify(req.body, null, 2));
      
      const parsed = CreateOrderSchema.safeParse(req.body);

      if (!parsed.success) {
        // console.error('❌ [OrdersController.create] Validação falhou');
        // console.error('❌ [OrdersController.create] Erros:', JSON.stringify(parsed.error.format(), null, 2));
        // console.error('❌ [OrdersController.create] Issues:', JSON.stringify(parsed.error.issues, null, 2));
        
        return res.status(400).json({
          error: "Dados inválidos",
          details: parsed.error.format(),
          issues: parsed.error.issues,
        });
      }

      // console.log('✅ [OrdersController.create] Validação OK');
      // console.log('✅ [OrdersController.create] Dados validados:', JSON.stringify(parsed.data, null, 2));
      
      const useCase = new CreateOrderUseCase();
      const order = await useCase.execute(parsed.data);

      // console.log('✅ [OrdersController.create] Pedido criado:', order.id);
      
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
      const message = err instanceof Error ? err.message : "Erro interno ao criar pedido";
      return res.status(500).json({ error: message });
    }
  }

  /**
   * GET /api/orders
   * Lista todos os pedidos do banco local
   */
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const useCase = new GetAllOrdersUseCase();
      const orders = await useCase.execute();

      return res.status(200).json(orders);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar pedidos";
      return res.status(500).json({ error: message });
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
      const message = err instanceof Error ? err.message : "Erro ao buscar pedido";
      return res.status(500).json({ error: message });
    }
  }

  static async getPerSellerOrders(req: Request, res: Response): Promise<Response> {

    try {
      const { codRep } = req.params;
      const currentUser = req.user;

      if (!codRep) {
        return res.status(400).json({ error: "Código do Vendedor é obrigatório." });
      }
      if (!currentUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!OrdersController.isPrivilegedRole(currentUser.role)) {
        if (!currentUser.codRep || Number(codRep) !== currentUser.codRep) {
          return res.status(403).json({ error: "Acesso negado para pedidos de outro vendedor" });
        }
      }

      const useCase = new GetLostOrdersUseCase();
      const lostOrders = await useCase.execute({ codRep });

      return res.status(200).json(lostOrders);
    } catch (err) {
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
        return res.status(400).json({ error: "ID do pedido é obrigatório." });
      }
      if (!currentUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!OrdersController.isPrivilegedRole(currentUser.role) && currentUser.role !== "VENDAS") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const parsed = UpdateOrderStatusSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: parsed.error.format(),
        });
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
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const parsed = AddLossReasonSchema.safeParse(req.body);

      if (!parsed.success) {
        console.error('❌ [OrdersController.addLossReason] Validação falhou');
        console.error('❌ [OrdersController.addLossReason] Erros:', JSON.stringify(parsed.error.format(), null, 2));
        console.error('❌ [OrdersController.addLossReason] Issues:', JSON.stringify(parsed.error.issues, null, 2));
        
        return res.status(400).json({
          error: "Dados inválidos",
          details: parsed.error.format(),
          issues: parsed.error.issues,
        });
      }

      if (
        currentUser.role === "VENDAS" &&
        currentUser.codRep &&
        parsed.data.submittedBy !== String(currentUser.codRep)
      ) {
        return res.status(403).json({ error: "Vendedor só pode registrar motivo para si próprio" });
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
      return res.status(500).json({ error: "Erro ao adicionar motivo de perda" });
    }
  }
}
