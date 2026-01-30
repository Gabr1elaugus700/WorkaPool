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

      const useCase = new GetLostOrdersUseCase();
      const lostOrders = await useCase.execute(parsed.data);

      return res.status(200).json(lostOrders);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar pedidos perdidos do SAPIENS";
      return res.status(500).json({ error: message });
    }
  }

  /**
   * POST /api/orders
   * Cria um novo pedido no banco local (PostgreSQL)
   */
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      console.log('🔷 [OrdersController.create] Requisição recebida');
      console.log('🔷 [OrdersController.create] Body:', JSON.stringify(req.body, null, 2));
      
      const parsed = CreateOrderSchema.safeParse(req.body);

      if (!parsed.success) {
        console.error('❌ [OrdersController.create] Validação falhou');
        console.error('❌ [OrdersController.create] Erros:', JSON.stringify(parsed.error.format(), null, 2));
        console.error('❌ [OrdersController.create] Issues:', JSON.stringify(parsed.error.issues, null, 2));
        
        return res.status(400).json({
          error: "Dados inválidos",
          details: parsed.error.format(),
          issues: parsed.error.issues,
        });
      }

      console.log('✅ [OrdersController.create] Validação OK');
      console.log('✅ [OrdersController.create] Dados validados:', JSON.stringify(parsed.data, null, 2));
      
      const useCase = new CreateOrderUseCase();
      const order = await useCase.execute(parsed.data);

      console.log('✅ [OrdersController.create] Pedido criado:', order.id);
      
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
      console.error('❌ [OrdersController.create] Erro:', err);
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

      if (!codRep) {
        return res.status(400).json({ error: "Código do Vendedor é obrigatório." });
      }

      const useCase = new GetLostOrdersUseCase();
      const lostOrders = await useCase.execute({ codRep });

      return res.status(200).json(lostOrders);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar pedidos do vendedor";
      return res.status(500).json({ error: message });
    }
  }
  /**
   * PATCH /api/orders/:id/status
   * Atualiza o status de um pedido
   */
  static async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "ID do pedido é obrigatório." });
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
      const message = err instanceof Error ? err.message : "Erro ao atualizar status do pedido";
      return res.status(500).json({ error: message });
    }
  }

  /**
   * POST /api/orders/loss-reason
   * Adiciona motivo de perda a um pedido e marca como perdido
   */
  static async addLossReason(req: Request, res: Response): Promise<Response> {
    try {  
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

      console.log('✅ [OrdersController.addLossReason] Validação OK');
      console.log('✅ [OrdersController.addLossReason] Dados validados:', JSON.stringify(parsed.data, null, 2));
      
      const useCase = new AddLossReasonUseCase();
      const lossReason = await useCase.execute(parsed.data);

      console.log('✅ [OrdersController.addLossReason] Motivo de perda adicionado:', lossReason.id);
      
      return res.status(201).json({
        id: lossReason.id,
        orderId: lossReason.orderId,
        code: lossReason.code,
        description: lossReason.description,
        submittedBy: lossReason.submittedBy,
        submittedAt: lossReason.submittedAt,
      });
    } catch (err) {
      console.error('❌ [OrdersController.addLossReason] Erro:', err);
      const message = err instanceof Error ? err.message : "Erro ao adicionar motivo de perda";
      return res.status(500).json({ error: message });
    }
  }
}
