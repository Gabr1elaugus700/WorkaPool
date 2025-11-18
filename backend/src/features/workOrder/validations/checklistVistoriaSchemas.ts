import { z } from "zod";

export const createChecklistVistoriaSchema = z.object({
  body: z.object({
    vistoria_id: z.string().min(3, "Vistoria é obrigatória!"),
    checklistModeloId: z.string().min(3, "Modelo é obrigatório!"),
    ordemServicoId: z.string().optional().nullable(),
    itens: z.array(
      z.object({
        checklistItemId: z.string().min(3, "Item é obrigatório!"),
        checked: z.boolean(),
        observacao: z.string().optional().nullable(),
      })
    ).min(1, "Pelo menos um item é obrigatório!"),
  }),
});

export const updateChecklistVistoriaSchema = z.object({
  body: z.object({
    responsavel_id: z.string().min(3, "Responsável é Obrigatório!"),
    data_vistoria: z.date().refine(
      (d) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const input = new Date(d);
        input.setHours(0, 0, 0, 0);
        return input >= now;
      },
      { message: "Data da Vistoria deve ser hoje ou futura!" }
    ),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
