import { z } from "zod";

const nota = z.number().min(0).max(10);

const itensIds = z
  .array(z.string().uuid())
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Itens repetidos no checklist",
  });

const checklistNome = z.string().trim().min(1).max(120);

const itemDescricao = z.string().trim().min(1).max(200);
const itemTipo = z.enum(["NUMERICO", "SIM_NAO"]);
const respostaEsperada = z.enum(["SIM", "NAO"]);

export const IbcChecklistHttpSchemas = {
  createItem: z
    .object({
      descricao: itemDescricao,
      tipo: itemTipo.optional(),
      critico: z.boolean().optional(),
      respostaEsperada: respostaEsperada.optional(),
      bloqueante: z.boolean().optional(),
    })
    .transform((data) => ({
      ...data,
      critico: data.tipo === "SIM_NAO" ? undefined : data.critico,
    })),
  updateItem: z
    .object({
      descricao: itemDescricao.optional(),
      tipo: itemTipo.optional(),
      critico: z.boolean().optional(),
      respostaEsperada: respostaEsperada.optional(),
      bloqueante: z.boolean().optional(),
      ativo: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Informe ao menos um campo",
    }),
  createChecklist: z.object({
    nome: checklistNome,
    notaMinimaCritico: nota,
    mediaMinima: nota,
    itensIds,
  }),
  updateChecklist: z
    .object({
      nome: checklistNome.optional(),
      notaMinimaCritico: nota.optional(),
      mediaMinima: nota.optional(),
      ativo: z.boolean().optional(),
      itensIds: itensIds.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Informe ao menos um campo",
    }),
  vincularChecklist: z.object({
    checklistModeloId: z.string().uuid(),
  }),
} as const;
