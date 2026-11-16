import { z } from "zod";

const respostaSimNao = z.enum(["SIM", "NAO"]);

const respostaBody = z.object({
  checklistItemId: z.string().uuid(),
  nota: z.number().int().min(0).max(10).optional(),
  resposta: respostaSimNao.optional(),
  observacao: z.string().trim().max(500).optional(),
});

export const IbcInspecaoHttpSchemas = {
  registrar: z.object({
    checklistModeloId: z.string().uuid(),
    respostas: z.array(respostaBody).min(1),
    observacao: z.string().trim().max(500).optional(),
  }),
} as const;