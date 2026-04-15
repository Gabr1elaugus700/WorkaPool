import { z } from "zod";

// Enums
export const OrderStatusEnum = z.enum(["NEGOTIATING", "LOST", "WON", "CANCELLED"]);
export const LossReasonCodeEnum = z.enum(["FREIGHT", "PRICE", "MARGIN", "STOCK", "OTHER"]);

// Create Order Schema
export const CreateOrderSchema = z.object({
  orderNumber: z.number().min(1, "O número do pedido é obrigatório"),
  status: OrderStatusEnum.default("NEGOTIATING"),
  idUser: z.string().uuid("O ID do usuário deve ser um UUID válido"),
  codRep: z.string().min(1, "O código do vendedor é obrigatório"),
});

export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;

// Update Order Status Schema
export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
});

export type UpdateOrderStatusDTO = z.infer<typeof UpdateOrderStatusSchema>;

// Add Loss Reason Schema
export const AddLossReasonSchema = z.object({
  orderId: z.string().uuid("O ID do pedido deve ser um UUID válido"),
  code: LossReasonCodeEnum,
  description: z.string().trim().min(10, "A descrição deve ter no mínimo 10 caracteres"),
  submittedBy: z.string().min(1, "O código do responsável é obrigatório"),
});

export type AddLossReasonDTO = z.infer<typeof AddLossReasonSchema>;

// Create Order Product Schema
export const CreateOrderProductSchema = z.object({
  orderNumber: z.number().min(1, "O Numero do pedido é obrigatório"),
  codprod: z.string().min(1, "O código do produto é obrigatório"),
  description: z.string().optional(),
});

export type CreateOrderProductDTO = z.infer<typeof CreateOrderProductSchema>;

// Query Filters for Lost Orders
export const GetLostOrdersFiltersSchema = z.object({
  codRep: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "startDate deve estar no formato DD-MM-YYYY")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "endDate deve estar no formato DD-MM-YYYY")
    .optional(),
}).refine(
  ({ startDate, endDate }) => {
    if (!startDate || !endDate) return true;
    const [sDay, sMonth, sYear] = startDate.split("-").map(Number);
    const [eDay, eMonth, eYear] = endDate.split("-").map(Number);
    const start = new Date(sYear, sMonth - 1, sDay);
    const end = new Date(eYear, eMonth - 1, eDay);
    return start <= end;
  },
  { message: "startDate deve ser menor ou igual a endDate", path: ["startDate"] },
);

export type GetLostOrdersFiltersDTO = z.infer<typeof GetLostOrdersFiltersSchema>;
