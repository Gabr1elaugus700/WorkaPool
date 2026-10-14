import type { SaldoIbcErpResult } from "../ports/ISaldoIbcErp";

const ordemBucketsConciliacaoErp = [
  "BAIXADOS",
  "SUBSTITUIDOS",
  "VENDIDOS",
  "TROCA",
  "EM_VIAGEM",
  "ENTRADA",
  "NO_CLIENTE",
  "PATIO",
] as const;

const bucketsVivosConciliacaoErp = [
  "PATIO",
  "EM_VIAGEM",
  "ENTRADA",
  "NO_CLIENTE",
] as const satisfies readonly (typeof ordemBucketsConciliacaoErp)[number][];

/** Ordem exclusiva de classificação e os buckets que entram em `vivosWp`. */
export const bucketsConciliacaoErp = {
  ordem: ordemBucketsConciliacaoErp,
  entramNaSoma: bucketsVivosConciliacaoErp,
};

export type BucketCicloConciliacaoErp = (typeof ordemBucketsConciliacaoErp)[number];

export type IbcCustodiaConciliacaoErp = "PATIO" | "EM_VIAGEM" | "ENTRADA" | "CLIENTE";

export type IbcMotivoBaixaConciliacaoErp = "VENDA" | "TROCA";

export type IbcAquisicaoConciliacaoErp = "COMPRA" | "TROCA";

/**
 * Projeção de um IBC para classificar. Cliente, pedido e vencimento já vêm
 * da alocação aberta; a data não vira flag de atraso.
 */
export type IbcParaConciliacaoErp = {
  identificador: string;
  custodia: IbcCustodiaConciliacaoErp;
  motivoBaixa: IbcMotivoBaixaConciliacaoErp | null;
  aquisicao: IbcAquisicaoConciliacaoErp;
  baixadoEm: Date | null;
  convertedToContainerId: string | null;
  loteId: string | null;
  numeroNf: string | null;
  /** Identificador do `#in` quando esta linha é o `#out` da troca. */
  trocaEntradaIdentificador: string | null;
  cliente: string | null;
  codCli: string | null;
  numPed: string | null;
  emprestimoVenceEm: Date | null;
};

export type ClassificacaoBucketConciliacaoErp = {
  bucket: BucketCicloConciliacaoErp;
  entraNaSoma: boolean;
  serialSemNf: boolean;
  /** Identificador do `#in` no bucket Troca. Nulo fora dele. */
  parIdentificador: string | null;
};

export type ContagemBucketConciliacaoErp = {
  bucket: BucketCicloConciliacaoErp;
  count: number;
  entraNaSoma: boolean;
};

export type SerialSemNfConciliacaoErp = {
  recorte: "SERIAL_SEM_NF";
  count: number;
  entraNaSoma: false;
};

export type NfSemSerializarConciliacaoErp = {
  status: "indisponivel";
  count: null;
};

export type AgregadoConciliacaoErp = {
  saldoErp: SaldoIbcErpResult;
  vivosWp: number;
  residual: number | null;
  buckets: ContagemBucketConciliacaoErp[];
  serialSemNf: SerialSemNfConciliacaoErp;
  nfSemSerializar: NfSemSerializarConciliacaoErp;
};
