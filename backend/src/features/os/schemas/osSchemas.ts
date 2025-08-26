import { z } from "zod";

export const createOSSchema = z.object({
  body: z.object({
    descricao: z.string().min(1, "Descrição Do serviço é Obrigatória!"),
    status: z.enum(["ABERTO", "FECHADO", "PENDENTE"]),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA"]),
    email_solicitante: z.string().email().optional(),
    id_solicitante: z.string().uuid().optional(),
    id_vistoria: z.string().uuid().optional(),
  }),
});

export const updateOSSchema = z.object({
  body: z.object({
    descricao: z.string().min(1).optional(),
    status: z.enum(["ABERTO", "FECHADO", "PENDENTE"]).optional(),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA"]).optional(),
    data_conclusao: z.date().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
