import { z } from "zod";
import type {
  BucketCicloConciliacaoErp,
  BucketConciliacaoErp,
  IbcAquisicaoConciliacaoErp,
  IbcCustodiaConciliacaoErp,
  IbcMotivoBaixaConciliacaoErp,
} from "../types/ConciliacaoErp.types";

const bucketCicloValues = [
  "BAIXADOS",
  "SUBSTITUIDOS",
  "VENDIDOS",
  "TROCA",
  "EM_VIAGEM",
  "ENTRADA",
  "NO_CLIENTE",
  "PATIO",
] as const satisfies readonly BucketCicloConciliacaoErp[];

const bucketConsultaValues = [
  ...bucketCicloValues,
  "SERIAL_SEM_NF",
] as const satisfies readonly BucketConciliacaoErp[];

/** Falha o typecheck se o query esquecer um bucket do domínio. */
const consultaCobreBuckets: [
  Exclude<BucketConciliacaoErp, (typeof bucketConsultaValues)[number]>,
] extends [never]
  ? true
  : never = true;
void consultaCobreBuckets;

const custodiaValues = [
  "PATIO",
  "EM_VIAGEM",
  "ENTRADA",
  "CLIENTE",
] as const satisfies readonly IbcCustodiaConciliacaoErp[];

const motivoBaixaValues = ["VENDA", "TROCA"] as const satisfies readonly IbcMotivoBaixaConciliacaoErp[];

const aquisicaoValues = ["COMPRA", "TROCA"] as const satisfies readonly IbcAquisicaoConciliacaoErp[];

const saldoErpSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("available"), quantity: z.number() }),
  z.object({ status: z.literal("unavailable") }),
]);

const itemSchema = z.object({
  id: z.string(),
  identificador: z.string(),
  bucket: z.enum(bucketCicloValues),
  custodia: z.enum(custodiaValues),
  motivoBaixa: z.enum(motivoBaixaValues).nullable(),
  aquisicao: z.enum(aquisicaoValues),
  cliente: z.string().nullable(),
  codCli: z.string().nullable(),
  numPed: z.string().nullable(),
  emprestimoVenceEm: z.string().datetime().nullable(),
  parIdentificador: z.string().nullable(),
  numeroNf: z.string().nullable(),
  baixadoEm: z.string().datetime().nullable(),
});

const relatorioSchema = z.object({
  saldoErp: saldoErpSchema,
  vivosWp: z.number().int(),
  residual: z.number().nullable(),
  buckets: z.array(
    z.object({
      bucket: z.enum(bucketCicloValues),
      count: z.number().int(),
      entraNaSoma: z.boolean(),
    }),
  ),
  serialSemNf: z.object({
    recorte: z.literal("SERIAL_SEM_NF"),
    count: z.number().int(),
    entraNaSoma: z.literal(false),
  }),
  nfSemSerializar: z.object({
    status: z.literal("indisponivel"),
    count: z.null(),
  }),
  itens: z.array(itemSchema),
});

const consultaSchema = z.object({
  query: z.object({
    bucket: z.enum(bucketConsultaValues).optional(),
  }),
});

export const conciliacaoErpSchemas = {
  consulta: consultaSchema,
  relatorio: relatorioSchema,
};
