import type { z } from "zod";
import { conciliacaoErpSchemas } from "../schemas/conciliacaoErp.schemas";
import type { RelatorioConciliacaoErp } from "../types/ConciliacaoErp.types";

export type ConciliacaoErpResponse = z.infer<typeof conciliacaoErpSchemas.relatorio>;

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

/** Datas do relatório viram ISO. O residual e a NF sem serializar passam intactos. */
export function toConciliacaoErpResponse(
  relatorio: RelatorioConciliacaoErp,
): ConciliacaoErpResponse {
  return {
    saldoErp: relatorio.saldoErp,
    vivosWp: relatorio.vivosWp,
    residual: relatorio.residual,
    buckets: relatorio.buckets,
    serialSemNf: relatorio.serialSemNf,
    nfSemSerializar: relatorio.nfSemSerializar,
    itens: relatorio.itens.map((item) => ({
      id: item.id,
      identificador: item.identificador,
      bucket: item.bucket,
      custodia: item.custodia,
      motivoBaixa: item.motivoBaixa,
      aquisicao: item.aquisicao,
      cliente: item.cliente,
      codCli: item.codCli,
      numPed: item.numPed,
      emprestimoVenceEm: iso(item.emprestimoVenceEm),
      parIdentificador: item.parIdentificador,
      numeroNf: item.numeroNf,
      baixadoEm: iso(item.baixadoEm),
    })),
  };
}
