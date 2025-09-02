import { z } from "zod";

export const CreateVistoriaSchema = z.object({
  body: z.object({
    data_vistoria: z.preprocess(
      (arg) => typeof arg === "string" ? new Date(arg) : arg,
      z.date({ required_error: "Data da vistoria é obrigatória" })
    ),
    responsavel_id: z.string().uuid(),
    departamento_id: z.string().uuid(),
  }),
});

export const updateVistoriaSchema = z.object({
  body: z.object({
    departamento_id: z.string().min(3, "Departamento é Obrigatório!"),
    data_vistoria: z.date().min(new Date(), "Data da Vistoria deve ser futura!"),
    responsavel_id: z.string().min(3, "Responsável é Obrigatório!"),  
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
