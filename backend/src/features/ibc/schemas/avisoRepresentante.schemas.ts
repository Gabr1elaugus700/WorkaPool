import { z } from "zod";

const itemAvisoRepresentanteSchema = z.object({
  identificador: z.string(),
  modalidade: z.enum(["VENDA", "EMPRESTIMO"]),
  emprestimoVenceEm: z.string().nullable(),
});

const avisoRepresentanteSchema = z.object({
  id: z.string().uuid(),
  codCar: z.number().int(),
  numPed: z.string(),
  codCli: z.string().nullable(),
  cliente: z.string(),
  codRep: z.number().int(),
  itens: z.array(itemAvisoRepresentanteSchema),
  lidoEm: z.string().nullable(),
  createdAt: z.string(),
});

export const avisoRepresentanteSchemas = {
  aviso: avisoRepresentanteSchema,
  lista: z.object({ avisos: z.array(avisoRepresentanteSchema) }),
  marcarLido: z.object({ params: z.object({ id: z.string().uuid() }) }),
};
