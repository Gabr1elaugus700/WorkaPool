import { z } from "zod";

export const IbcEntradaPatioHttpSchemas = {
  abrir: z.object({
    origem: z.enum(["RETORNO", "TROCA"]),
  }),
} as const;
