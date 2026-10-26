import { z } from "zod";

const containerCargaSchema = z.object({
  ibcId: z.string(),
  identificador: z.string(),
  grupoCodigo: z.string().nullable(),
  sigla: z.string().nullable(),
  corHex: z.string().nullable(),
  universal: z.boolean(),
  homologado: z.boolean(),
  /** Preenchido quando o container já está vinculado a esta carga. */
  alocacaoId: z.string().nullable(),
});

const grupoContainerCargaSchema = z.object({
  grupoCodigo: z.string(),
  sigla: z.string().nullable(),
  corHex: z.string().nullable(),
});

/** Corpo 200 da paleta de containers da Preparação. */
export const containersCargaSchemas = {
  resposta: z.object({
    gruposPermitidos: z.array(grupoContainerCargaSchema),
    itens: z.array(containerCargaSchema),
  }),
};
