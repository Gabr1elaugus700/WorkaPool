import { z } from "zod";

export const IbcCadastroHttpSchemas = {
  createNovo: z.object({
    dataLimite: z.coerce.date(),
    produtoId: z.string().uuid(),
  }),
  createLote: z.object({
    quantidade: z.number().int(),
    dataLimite: z.coerce.date(),
    numeroNf: z.string().trim().min(1).optional().nullable(),
    produtoId: z.string().uuid(),
  }),
  patchDataLimite: z.object({
    dataLimite: z.coerce.date(),
    identificador: z.string().optional(),
  }),
  convertToNaoHomologado: z.object({
    confirmado: z.literal(true),
    observacao: z.string().trim().min(1).max(500).optional().nullable(),
  }),
  changeProduto: z.object({
    produtoId: z.string().uuid(),
    confirmado: z.literal(true),
    observacao: z.string().trim().min(1).max(500).optional().nullable(),
  }),
} as const;
