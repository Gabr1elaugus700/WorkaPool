import { z } from "zod";

export const IbcChecklistHttpSchemas = {
  createItem: z.object({
    descricao: z.string().trim().min(1).max(200),
    critico: z.boolean().default(false),
  }),
  updateItem: z
    .object({
      descricao: z.string().trim().min(1).max(200).optional(),
      critico: z.boolean().optional(),
      ativo: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Informe ao menos um campo",
    }),
} as const;
