import { z } from "zod";

export const createDepartamentoSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nome Do departamento é Obrigatória!"),
    recebe_os: z.boolean().optional(),
  }),
});

export const updateDepartamentoSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    recebe_os: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
