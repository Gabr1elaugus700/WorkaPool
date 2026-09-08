import { z } from "zod";

export const IbcCadastroHttpSchemas = {
  createNovo: z.object({
    dataLimite: z.coerce.date(),
  }),
  patchDataLimite: z.object({
    dataLimite: z.coerce.date(),
    identificador: z.string().optional(),
  }),
} as const;
