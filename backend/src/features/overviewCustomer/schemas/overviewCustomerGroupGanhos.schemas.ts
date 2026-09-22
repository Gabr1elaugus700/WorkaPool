import { z } from "zod";

export const getOverviewCustomerGroupGanhosSchema = z.object({
  params: z.object({
    clienteId: z.coerce.number().int().positive(),
    grupoCodigo: z.string().trim().min(1),
  }),
});

export const overviewCustomerGroupGanhoSchema = z.object({
  numnfv: z.number().int(),
  numped: z.number().int(),
  datemi: z.string(),
  vlrfinal: z.number(),
  qtdped: z.number(),
  preuni: z.number(),
  margem: z.number().nullable(),
});

export const overviewCustomerGroupGanhosResponseSchema = z.object({
  customerCode: z.number().int().positive(),
  grupoCodigo: z.string(),
  ganhos: z.array(overviewCustomerGroupGanhoSchema).max(5),
});
