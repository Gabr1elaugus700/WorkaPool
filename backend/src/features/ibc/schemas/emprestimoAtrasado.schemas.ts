import { z } from "zod";

const emprestimoAtrasadoSchema = z.object({
  id: z.string().uuid(),
  identificador: z.string(),
  cliente: z.string().nullable(),
  codCli: z.string().nullable(),
  numPed: z.string(),
  codCar: z.number().int(),
  codRep: z.number().int().nullable(),
  emprestimoVenceEm: z.string().datetime(),
});

/** Corpo 200. Sem query: a lista inteira cabe na resposta. */
export const emprestimoAtrasadoSchemas = {
  lista: z.object({
    itens: z.array(emprestimoAtrasadoSchema),
  }),
};
