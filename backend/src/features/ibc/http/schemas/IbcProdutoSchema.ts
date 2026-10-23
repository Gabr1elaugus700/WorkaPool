import { z } from "zod";

const corHexSchema = z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/);
const siglaSchema = z.string().trim().regex(/^[A-Za-z]{1,2}$/);
export const universalConfigSchema = z.object({
  id: z.string().nullable(), corHex: z.string().nullable(), configurado: z.boolean(), emUso: z.boolean(),
});
export const grupoConfigSchema = z.object({
  id: z.string().nullable(), grupoCodigo: z.string(), grupoDescricao: z.string().nullable(),
  sigla: z.string().nullable(), corHex: z.string().nullable(), configurado: z.boolean(),
  emUso: z.boolean(), encontradoNoSapiens: z.boolean(),
});

export const ibcProdutoConfigSchemas = {
  lista: z.object({ universal: universalConfigSchema, grupos: z.array(grupoConfigSchema) }),
  grupo: grupoConfigSchema,
  universal: universalConfigSchema,
  salvarUniversal: z.object({ body: z.object({ corHex: corHexSchema }) }),
  salvarGrupo: z.object({
    params: z.object({ grupoCodigo: z.string().trim().min(1).max(10) }),
    body: z.object({ sigla: siglaSchema, corHex: corHexSchema }),
  }),
};

export type UniversalConfigItem = z.infer<typeof universalConfigSchema>;
export type GrupoConfigItem = z.infer<typeof grupoConfigSchema>;
export type ListaIbcProdutoConfig = z.infer<typeof ibcProdutoConfigSchemas.lista>;
