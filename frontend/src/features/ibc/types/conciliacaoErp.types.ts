export type BucketCicloConciliacaoErp =
  "PATIO" | "EM_VIAGEM" | "ENTRADA" | "NO_CLIENTE" | "VENDIDOS" | "TROCA" | "BAIXADOS" | "SUBSTITUIDOS";
export type BucketConsultaConciliacaoErp = BucketCicloConciliacaoErp | "SERIAL_SEM_NF";
export type SaldoErpConciliacao =
  | { status: "available"; quantity: number }
  | { status: "unavailable" };
export type ContagemBucketConciliacaoErp = {
  bucket: BucketCicloConciliacaoErp;
  count: number;
  entraNaSoma: boolean;
};
export type ItemConciliacaoErp = {
  id: string; identificador: string;
  cliente: string | null; codCli: string | null; numPed: string | null;
  emprestimoVenceEm: string | null; parIdentificador: string | null;
  numeroNf: string | null; baixadoEm: string | null;
};
export type RelatorioConciliacaoErp = {
  saldoErp: SaldoErpConciliacao;
  vivosWp: number;
  residual: number | null;
  buckets: ContagemBucketConciliacaoErp[];
  serialSemNf: { recorte: "SERIAL_SEM_NF"; count: number; entraNaSoma: false };
  nfSemSerializar: { status: "indisponivel"; count: null };
  itens: ItemConciliacaoErp[];
};
