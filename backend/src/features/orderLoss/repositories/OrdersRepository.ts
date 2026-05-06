import { PrismaClient } from "@prisma/client";
import { LossReasonCode, Order, OrderStatus } from "../entities/Order";
import { OrderProduct } from "../entities/OrderProduct";
import { LossReason } from "../entities/LossReason";
import {
  IOrdersRepository,
  LostOrderFromSapiens,
  OrderWithLossReason,
} from "./IOrdersRepository";
import { sqlPool } from "../../../database/sqlServer";
import { AppError } from "../../../utils/AppError";
import { PedidosSapiensFiltersDTO } from "../../pedidos";

export class OrdersRepository implements IOrdersRepository {
  constructor(private prisma: PrismaClient = new PrismaClient()) {}

  async create(order: Order): Promise<void> {
    await this.prisma.order.create({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        idUser: order.idUser,
        codRep: order.codRep,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  }

  async update(order: Order): Promise<void> {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: order.status,
        updatedAt: order.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) return null;

    return new Order({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status as OrderStatus,
      idUser: order.idUser,
      codRep: order.codRep,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  }

  async findByOrderNumber(orderNumber: number): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) return null;

    return new Order({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status as OrderStatus,
      idUser: order.idUser,
      codRep: order.codRep,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  }

  async getAll(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    return orders.map(
      (order) =>
        new Order({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status as OrderStatus,
          idUser: order.idUser,
          codRep: order.codRep,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }),
    );
  }

  async getAllWithLossReasons(): Promise<OrderWithLossReason[]> {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lossReason: true,
        products: true,
      }
    });

    return orders.map((order) => ({
      order: new Order({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status as OrderStatus,
        idUser: order.idUser,
        codRep: order.codRep,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }),
      lossReason: order.lossReason
        ? new LossReason({
            id: order.lossReason.id,
            orderId: order.lossReason.orderId,
            code: order.lossReason.code as any,
            description: order.lossReason.description,
            submittedBy: order.lossReason.submittedBy,
            submittedAt: order.lossReason.submittedAt,
          })
        : null,
      products: order.products.map(
        (product) =>
          new OrderProduct({
            id: product.id,
            orderId: product.orderId,
            codprod: product.codprod,
            description: product.description || undefined,
            createdAt: product.createdAt,
          }),
      ),
    }));
  }

  async getLostOrdersFromSapiens(
    filters?: PedidosSapiensFiltersDTO,
  ): Promise<LostOrderFromSapiens[]> {
    try {
      await sqlPool;

      let query = `
        SELECT  ped.datemi [DATA]
                ,ped.numped [NUMPED]
                ,ped.sitped [SITUAÇÃO]
                ,ped.codven [CODREP]
                ,rep.aperep [APEREP]
                ,ped.codcli [CODCLI]
                ,cli.apecli [FANTASIA]
                ,(cli.cidcli + ' - ' + cli.sigufs) [CIDADE]
                ,ipd.codpro [CODPRO]
                ,ISNULL(grp.desgrp, 'OUTROS PRODUTOS')  [PRODUTO]
                ,ipd.qtdped [QTDPED]
                ,ipd.preuni [PREUNI]
                ,ipd.usu_vlrfin [VLRFINAL]
                ,ipd.usu_mgmluc [MARGEM LUCRO]
                ,ipd.usu_vlrfre [VLRFRETE]
                ,ipd.usu_vlripi [IPI]
                ,ipd.usu_vlricm [ICMS]
        FROM e120ped ped
        LEFT JOIN e120ipd ipd 
                  ON ipd.codemp = ped.codemp
                AND ipd.codfil = ped.codfil
                AND ipd.numped = ped.numped	   
        LEFT JOIN e090rep rep 
                ON rep.codrep = ped.codven	
        LEFT JOIN e085cli cli 	
                ON cli.codcli = ped.codcli
        LEFT JOIN e085hcl hcl 
                  ON hcl.codemp = ped.codemp
                AND hcl.codfil = ped.codfil
                AND hcl.codcli = ped.codcli
        LEFT JOIN poolbi.dbo.grppro grp 
                ON grp.codpro = ipd.codpro
        WHERE ped.sitped = '5'
      `;

      const conditions: string[] = [];
      const request = sqlPool.request();
      const defaultStartDate = "01-01-2026";

      conditions.push("ped.datemi >= @startDate");
      request.input("startDate", filters?.startDate ?? defaultStartDate);

      if (filters?.endDate) {
        conditions.push("ped.datemi <= @endDate");
        request.input("endDate", filters.endDate);
      }

      if (filters?.codRep) {
        conditions.push("ped.codven = @codRep");
        request.input("codRep", filters.codRep);
      }

      if (conditions.length > 0) {
        query += ` AND ${conditions.join(" AND ")}`;
      }

      const result = await request.query(query);
      return result.recordset as LostOrderFromSapiens[];
    } catch (error) {
      console.error("Erro ao buscar pedidos perdidos do SAPIENS:", error);
      throw new AppError({
        message: "Erro ao buscar pedidos perdidos do SAPIENS",
        statusCode: 500,
        code: "ORDER_LOST_SAPIENS_FETCH_ERROR",
        details: {
          startDate: filters?.startDate,
          endDate: filters?.endDate,
          codRep: filters?.codRep,
        },
      });
    }
  }

  async addProduct(product: OrderProduct): Promise<void> {
    await this.prisma.orderProduct.create({
      data: {
        id: product.id,
        orderId: product.orderId,
        codprod: product.codprod,
        description: product.description,
        createdAt: product.createdAt,
      },
    });
  }

  async getProductsByOrderId(orderId: string): Promise<OrderProduct[]> {
    const products = await this.prisma.orderProduct.findMany({
      where: { orderId },
    });

    return products.map(
      (product) =>
        new OrderProduct({
          id: product.id,
          orderId: product.orderId,
          codprod: product.codprod,
          description: product.description || undefined,
          createdAt: product.createdAt,
        }),
    );
  }

  async addLossReason(lossReason: LossReason): Promise<void> {
    await this.prisma.lossReason.create({
      data: {
        id: lossReason.id,
        orderId: lossReason.orderId,
        code: lossReason.code,
        description: lossReason.description,
        submittedBy: lossReason.submittedBy,
        submittedAt: lossReason.submittedAt,
      },
    });
  }

  async getLossReasonByOrderId(orderId: string): Promise<LossReason | null> {
    const lossReason = await this.prisma.lossReason.findUnique({
      where: { orderId },
    });

    if (!lossReason) return null;

    return new LossReason({
      id: lossReason.id,
      orderId: lossReason.orderId,
      code: lossReason.code as any,
      description: lossReason.description,
      submittedBy: lossReason.submittedBy,
      submittedAt: lossReason.submittedAt,
    });
  }

  async updateLossReason(
    orderId: string,
    code: LossReasonCode,
    description: string,
    submittedBy: string,
  ): Promise<LossReason> {
    const updated = await this.prisma.lossReason.update({
      where: { orderId },
      data: { code, description, submittedBy },
    });

    return new LossReason({
      id: updated.id,
      orderId: updated.orderId,
      code: updated.code as any,
      description: updated.description,
      submittedBy: updated.submittedBy,
      submittedAt: updated.submittedAt,
    });
  }
}
