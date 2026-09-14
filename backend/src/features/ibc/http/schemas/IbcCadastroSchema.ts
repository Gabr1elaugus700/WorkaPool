import { z } from "zod";

export const IbcCadastroHttpSchemas = {
  createNovo: z.object({
    dataLimite: z.coerce.date(),
  }),
  createLote: z.object({
    quantidade: z.number().int(),
    dataLimite: z.coerce.date(),
    numeroNf: z.string().trim().min(1).optional().nullable(),
  }),
  patchDataLimite: z.object({
    dataLimite: z.coerce.date(),
    identificador: z.string().optional(),
  }),
} as const;
