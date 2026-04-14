import { apiFetchJson } from "@/lib/apiFetch";
import {
  Order,
  LostOrderFromSapiens,
  GetLostOrdersFilters,
  CreateOrderDTO,
  LossReasonCode,
  OrderWithLossReason,
  OrderStatus,
} from "../types/orderLoss.types";

function buildLostSapiensQuery(filters?: GetLostOrdersFilters): string {
  const params = new URLSearchParams();
  if (filters?.codRep) params.append("codRep", filters.codRep);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  const q = params.toString();
  return q ? `?${q}` : "";
}

function normalizeCreateOrderPayload(data: CreateOrderDTO) {
  const num =
    typeof data.orderNumber === "string"
      ? Number(data.orderNumber)
      : data.orderNumber;
  if (Number.isNaN(num)) {
    throw new Error("Número do pedido inválido");
  }
  return {
    ...data,
    orderNumber: num,
  };
}

export const OrderService = {
  getAll: async (): Promise<OrderWithLossReason[]> => {
    return apiFetchJson<OrderWithLossReason[]>("/api/orders");
  },

  getLost: async (
    filters?: GetLostOrdersFilters,
  ): Promise<LostOrderFromSapiens[]> => {
    const qs = buildLostSapiensQuery(filters);
    return apiFetchJson<LostOrderFromSapiens[]>(`/api/orders/lost-sapiens${qs}`);
  },

  create: async (data: CreateOrderDTO): Promise<Order> => {
    const payload = normalizeCreateOrderPayload(data);
    return apiFetchJson<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  addLossReason: async (
    orderId: string,
    code: LossReasonCode,
    description: string,
    submittedBy: string,
  ): Promise<{
    id: string;
    orderId: string;
    code: string;
    description: string;
    submittedBy: string;
    submittedAt: string;
  }> => {
    return apiFetchJson("/api/orders/loss-reason", {
      method: "POST",
      body: JSON.stringify({ orderId, code, description, submittedBy }),
    });
  },

  createOrderWithLossReason: async (
    orderNumber: string,
    codRep: string,
    idUser: string,
    code: LossReasonCode,
    description: string,
  ): Promise<Order> => {
    const order = await OrderService.create({
      orderNumber,
      idUser,
      codRep,
      status: "LOST",
    });
    await OrderService.addLossReason(order.id, code, description, codRep);
    return order;
  },

  /** PATCH /api/orders/:id/status */
  patchOrderStatus: async (
    id: string,
    status: OrderStatus,
  ): Promise<{
    id: string;
    orderNumber: number;
    status: OrderStatus;
    idUser: string;
    codRep: string;
    updatedAt: string;
  }> => {
    return apiFetchJson(`/api/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
