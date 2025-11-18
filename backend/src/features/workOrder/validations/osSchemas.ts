import { z } from "zod";

export const createOSSchema = z.object({
  body: z.object({
    descricao: z.string().min(1, "Descrição Do serviço é Obrigatória!"),
    problema: z.string().min(1, "Descreva seu Problema!"),
    status: z.enum(["ABERTA", "EM_ANDAMENTO", "FINALIZADA", "CANCELADA"]).optional(),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA"]),
    email_solicitante: z.string().email().optional(),
    id_solicitante: z.string().uuid().optional(),
    id_vistoria: z.string().uuid().optional(),
    id_departamento: z.string().uuid().optional(),
    localizacao: z.string().min(1, "Informe a Localização").optional(),
    imagens: z.any().optional()
  }),
});

export const updateOSSchema = z.object({
  body: z.object({
    descricao: z.string().min(1).optional(),
    problema: z.string().min(1).optional(),
    status: z.enum(["ABERTA", "EM_ANDAMENTO", "FINALIZADA", "CANCELADA"]).optional(),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA"]).optional(),
    data_conclusao: z.date().optional(),
    localizacao: z.string().min(1, "Informe a Localização").optional(),
    imagens: z.any().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
