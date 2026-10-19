import { z } from "zod";

const destino = z.enum(["FICOU", "RETORNOU", "TROCA"]);
const modalidade = z.enum(["VENDA", "EMPRESTIMO"]);

export const IbcConciliacaoHttpSchemas = {
  troca: z.object({
    alocacaoIbcId: z.string().uuid(),
    produtoId: z.string().uuid(),
    dataLimite: z.coerce.date(),
  }),
  salvar: z.object({
    itens: z
      .array(z.object({
        alocacaoIbcId: z.string().uuid(),
        destino,
        numPed: z.string().min(1).optional(),
        modalidade: modalidade.nullable().optional(),
      }))
      .max(500)
      .optional(),
    retornosSemId: z
      .array(z.object({
        chaveCliente: z.string().min(1),
        quantidadePapel: z.number().int().min(0).max(999),
        confirmouDivergencia: z.boolean().optional(),
      }))
      .max(200)
      .optional(),
  }),
} as const;
