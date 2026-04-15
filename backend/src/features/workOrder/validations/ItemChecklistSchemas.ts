import { z } from "zod";

export const createItemChecklistSchema = z.object({
  body: z.object({
    descricao: z.string().min(3, "Descrição Do Item é Obrigatória!"),
  }),
});

export const updateItemChecklistSchema = z.object({
  body: z.object({
    descricao: z.string().min(3, "Descrição Do Item é Obrigatória!"),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
