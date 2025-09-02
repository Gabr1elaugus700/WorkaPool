import { z } from "zod";

export const createChecklistModeloSchema = z.object({
  body: z.object({
    nome: z.string().min(3, "Nome do Modelo é Obrigatório!"),
    departamento_id: z.string().min(3, "Departamento é Obrigatório!"),
    itens: z.array(z.string().min(3, "Nome do Item é Obrigatório!")).min(1, "Pelo menos um item é obrigatório!"),
  }),
});

export const updateChecklistModeloSchema = z.object({
  body: z.object({
    nome: z.string().min(3, "Nome do Modelo é Obrigatório!"),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
