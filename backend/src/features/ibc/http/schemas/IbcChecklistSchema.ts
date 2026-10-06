import { z } from "zod";

const nota = z.number().min(0).max(10);

const itensIds = z
  .array(z.string().uuid())
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Itens repetidos no checklist",
  });

const checklistNome = z.string().trim().min(1).max(120);

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
  createChecklist: z.object({
    nome: checklistNome,
    notaMinimaCritico: nota,
    mediaMinima: nota,
    itensIds,
  }),
} as const;
