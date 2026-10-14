import type { SaldoIbcErpResult } from "../ports/ISaldoIbcErp";
import {
  bucketsConciliacaoErp,
  type AgregadoConciliacaoErp,
  type BucketCicloConciliacaoErp,
  type IbcParaConciliacaoErp,
} from "../types/ConciliacaoErp.types";
import { classificarBucketConciliacaoErp } from "./classificarBucketConciliacaoErp";

const ENTRAM_NA_SOMA = new Set<BucketCicloConciliacaoErp>(bucketsConciliacaoErp.entramNaSoma);

/**
 * `vivosWp` soma só pátio, em viagem, entrada e no cliente.
 * Residual = saldo ERP − vivos; nulo se o saldo não veio; pode ser negativo.
 * NF sem serializar não tem quantidade no lote: fica indisponível.
 */
export function agregarConciliacaoErp(
  ibcs: readonly IbcParaConciliacaoErp[],
  saldoErp: SaldoIbcErpResult,
): AgregadoConciliacaoErp {
  const counts = new Map<BucketCicloConciliacaoErp, number>();
  for (const bucket of bucketsConciliacaoErp.ordem) {
    counts.set(bucket, 0);
  }

  let vivosWp = 0;
  let serialSemNf = 0;
  for (const ibc of ibcs) {
    const classificacao = classificarBucketConciliacaoErp(ibc);
    counts.set(classificacao.bucket, (counts.get(classificacao.bucket) ?? 0) + 1);
    if (classificacao.entraNaSoma) vivosWp += 1;
    if (classificacao.serialSemNf) serialSemNf += 1;
  }

  return {
    saldoErp,
    vivosWp,
    residual: saldoErp.status === "available" ? saldoErp.quantity - vivosWp : null,
    buckets: bucketsConciliacaoErp.ordem.map((bucket) => ({
      bucket,
      count: counts.get(bucket) ?? 0,
      entraNaSoma: ENTRAM_NA_SOMA.has(bucket),
    })),
    serialSemNf: {
      recorte: "SERIAL_SEM_NF",
      count: serialSemNf,
      entraNaSoma: false,
    },
    nfSemSerializar: {
      status: "indisponivel",
      count: null,
    },
  };
}
