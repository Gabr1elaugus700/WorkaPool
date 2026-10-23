import { z } from "zod";

const grupoCodigoSchema = z.string().trim().max(10).optional().nullable();
const cadastroComum = {
  dataLimite: z.coerce.date(),
  homologado: z.boolean(),
  grupoCodigo: grupoCodigoSchema,
};

export const ibcCadastroResponseSchema = z.object({
  id: z.string(), identificador: z.string(), prefixo: z.string().nullable(),
  sequencial: z.number().int().nullable(), tipoCadastro: z.enum(["NOVO", "TROCA"]),
  aptidao: z.enum(["APTO", "INAPTO"]), custodia: z.enum(["PATIO", "EM_VIAGEM", "ENTRADA", "CLIENTE"]),
  dataLimite: z.string().nullable(), produtoId: z.string().nullable(),
  corHex: z.string().nullable(), universal: z.boolean(), homologado: z.boolean(),
});

export const ibcLoteResponseSchema = z.object({
  items: z.array(ibcCadastroResponseSchema),
  lote: z.object({ id: z.string(), numeroNf: z.string().nullable(), dataLimite: z.string() }),
  warning: z.object({
    code: z.enum(["OVER_SALDO", "SALDO_UNAVAILABLE"]), vivos: z.number(), quantidade: z.number(), saldo: z.number().optional(),
  }).optional(),
});

export const IbcCadastroHttpSchemas = {
  createNovo: z.object({ body: z.object(cadastroComum) }),
  createLote: z.object({
    body: z.object({
      quantidade: z.number().int(),
      numeroNf: z.string().trim().min(1).optional().nullable(),
      ...cadastroComum,
    }),
  }),
  patchDataLimite: z.object({
    dataLimite: z.coerce.date(),
    identificador: z.string().optional(),
  }),
  convertToNaoHomologado: z.object({
    confirmado: z.literal(true),
    destino: z.enum(["manter_grupo", "universal"]),
    grupoCodigo: z.string().trim().min(1).max(10).optional().nullable(),
    observacao: z.string().trim().min(1).max(500).optional().nullable(),
  }),
  changeProduto: z.object({
    produtoId: z.string().uuid(),
    confirmado: z.literal(true),
    observacao: z.string().trim().min(1).max(500).optional().nullable(),
  }),
} as const;

export const ibcHistoricoEventoSchema = z.object({
  id: z.string(),
  changeType: z.enum(["conversion", "product_change", "status_change"]),
  observation: z.string().nullable(),
  actorId: z.string(),
  actorName: z.string().nullable(),
  createdAt: z.string(),
  from: z.object({ id: z.string(), identificador: z.string() }),
  to: z.object({ id: z.string(), identificador: z.string() }),
  identificadorAnterior: z.string().nullable(),
  corAnterior: z.string().nullable(),
  identificadorNovo: z.string().nullable(),
  corNova: z.string().nullable(),
});
