import {
  bucketsConciliacaoErp,
  type BucketCicloConciliacaoErp,
  type ClassificacaoBucketConciliacaoErp,
  type IbcParaConciliacaoErp,
} from "../types/ConciliacaoErp.types";

const ENTRAM_NA_SOMA = new Set<BucketCicloConciliacaoErp>(bucketsConciliacaoErp.entramNaSoma);

/**
 * Um IBC cai em um único bucket de ciclo de vida, nesta ordem:
 * baixado, substituído, vendido, troca (`#out`), depois a custódia.
 * Serial sem NF não é bucket: é recorte de compra ainda viva.
 */
function bucketCiclo(ibc: IbcParaConciliacaoErp): BucketCicloConciliacaoErp {
  if (ibc.baixadoEm != null) return "BAIXADOS";
  if (ibc.convertedToContainerId != null) return "SUBSTITUIDOS";
  if (ibc.motivoBaixa === "VENDA") return "VENDIDOS";
  if (ibc.motivoBaixa === "TROCA") return "TROCA";
  return bucketPorCustodia(ibc.custodia);
}

function bucketPorCustodia(
  custodia: IbcParaConciliacaoErp["custodia"],
): BucketCicloConciliacaoErp {
  switch (custodia) {
    case "EM_VIAGEM":
      return "EM_VIAGEM";
    case "ENTRADA":
      return "ENTRADA";
    case "CLIENTE":
      return "NO_CLIENTE";
    case "PATIO":
      return "PATIO";
  }
}

function serialSemNf(ibc: IbcParaConciliacaoErp, bucket: BucketCicloConciliacaoErp): boolean {
  if (!ENTRAM_NA_SOMA.has(bucket)) return false;
  if (ibc.aquisicao !== "COMPRA") return false;
  return ibc.loteId == null || ibc.numeroNf == null;
}

export function classificarBucketConciliacaoErp(
  ibc: IbcParaConciliacaoErp,
): ClassificacaoBucketConciliacaoErp {
  const bucket = bucketCiclo(ibc);
  return {
    bucket,
    entraNaSoma: ENTRAM_NA_SOMA.has(bucket),
    serialSemNf: serialSemNf(ibc, bucket),
    parIdentificador: bucket === "TROCA" ? ibc.trocaEntradaIdentificador : null,
  };
}
