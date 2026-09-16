import { z } from "zod";

export const IbcProdutoHttpSchemas = {
  create: z.object({
    nome: z.string().trim().min(1),
    abreviacao: z.string().trim().min(1).max(2),
  }),
  update: z.object({
    nome: z.string().trim().min(1),
    abreviacao: z.string().trim().min(1).max(2),
  }),
} as const;
