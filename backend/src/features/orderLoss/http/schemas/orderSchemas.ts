import { z } from "zod";

// Enums
export const OrderStatusEnum = z.enum(["NEGOTIATING", "LOST", "WON", "CANCELLED"]);
export const LossReasonCodeEnum = z.enum(["FREIGHT", "PRICE", "MARGIN", "STOCK", "OTHER"]);

// Create Order Schema
export const CreateOrderSchema = z.object({
  orderNumber: z.string().min(1, "O número do pedido é obrigatório"),
  status: OrderStatusEnum.default("NEGOTIATING"),
  codRep: z.string().min(1, "O ID do vendedor é obrigatório"),
});

export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;

// Update Order Status Schema
export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
});

export type UpdateOrderStatusDTO = z.infer<typeof UpdateOrderStatusSchema>;

// Add Loss Reason Schema
export const AddLossReasonSchema = z.object({
  orderNumber: z.string().min(1, "O Numero do pedido é obrigatório"),
  code: LossReasonCodeEnum,
  description: z.string().min(1, "A descrição é obrigatória"),
});

export type AddLossReasonDTO = z.infer<typeof AddLossReasonSchema>;

// Create Order Product Schema
export const CreateOrderProductSchema = z.object({
  orderNumber: z.string().min(1, "O Numero do pedido é obrigatório"),
  codprod: z.string().min(1, "O código do produto é obrigatório"),
  description: z.string().optional(),
});

export type CreateOrderProductDTO = z.infer<typeof CreateOrderProductSchema>;

// Query Filters for Lost Orders
export const GetLostOrdersFiltersSchema = z.object({
  codRep: z.string().optional(),
});

export type GetLostOrdersFiltersDTO = z.infer<typeof GetLostOrdersFiltersSchema>;
