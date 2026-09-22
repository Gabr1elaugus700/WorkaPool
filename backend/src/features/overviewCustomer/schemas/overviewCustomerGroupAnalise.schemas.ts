import { z } from "zod";
import { overviewCustomerGroupGanhoSchema } from "./overviewCustomerGroupGanhos.schemas";

export const getOverviewCustomerGroupAnaliseSchema = z.object({
  params: z.object({
    clienteId: z.coerce.number().int().positive(),
    grupoCodigo: z.string().trim().min(1),
  }),
});

export const overviewCustomerGroupPerdidoSchema = z.object({
  numped: z.number().int(),
  datemi: z.string(),
  vlrfinal: z.number(),
  qtdped: z.number(),
  preuni: z.number(),
  margem: z.number().nullable(),
  motivo: z.string(),
});

export const overviewCustomerGroupAnaliseResponseSchema = z.object({
  customerCode: z.number().int().positive(),
  grupoCodigo: z.string(),
  ganhos: z.array(overviewCustomerGroupGanhoSchema).max(5),
  perdidos: z.array(overviewCustomerGroupPerdidoSchema).max(5).nullable(),
  perdidosFailed: z.boolean(),
});
