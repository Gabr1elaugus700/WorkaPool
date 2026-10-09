import { z } from "zod";

export const IbcInspecaoHttpSchemas = {
  registrar: z.object({
    checklistModeloId: z.string().uuid(),
    respostas: z
      .array(
        z.object({
          checklistItemId: z.string().uuid(),
          nota: z.number().int().min(0).max(10),
        }),
      )
      .min(1),
    observacao: z.string().trim().max(500).optional(),
  }),
} as const;
