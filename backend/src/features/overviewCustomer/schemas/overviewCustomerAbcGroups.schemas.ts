import { z } from "zod";

export const getOverviewCustomerAbcGroupsSchema = z.object({
  params: z.object({
    clienteId: z.coerce.number().int().positive(),
  }),
});

export const overviewCustomerAbcGroupSchema = z.object({
  grupoCodigo: z.string(),
  grupoDescricao: z.string(),
  revenueShare: z.number(),
});

export const overviewCustomerAbcGroupsResponseSchema = z.object({
  customerCode: z.number().int().positive(),
  grupos: z.array(overviewCustomerAbcGroupSchema).max(5),
});
