import { Role } from "@prisma/client";
import { ISaldoIbcErp } from "../ports/ISaldoIbcErp";
import { assertCanLerConciliacaoErp } from "../permissions/assertCanLerConciliacaoErp";
import {
  IIbcConciliacaoErpRepository,
  IbcLinhaConciliacaoErp,
} from "../repositories/IIbcConciliacaoErpRepository";
import { agregarConciliacaoErp } from "../services/agregarConciliacaoErp";
import { classificarBucketConciliacaoErp } from "../services/classificarBucketConciliacaoErp";
import {
  BucketCicloConciliacaoErp,
  BucketConciliacaoErp,
  ClassificacaoBucketConciliacaoErp,
  ItemConciliacaoErp,
  RelatorioConciliacaoErp,
} from "../types/ConciliacaoErp.types";

const BUCKETS_COM_PEDIDO = new Set<BucketCicloConciliacaoErp>([
  "NO_CLIENTE",
  "VENDIDOS",
  "TROCA",
]);

export type GetConciliacaoErpInput = {
  role: Role;
  bucket?: BucketConciliacaoErp;
};

/**
 * Relatório somente leitura. Classifica o pool em memória e lê o saldo ERP.
 * Não grava custódia, não abre outbox e não escreve no Sapiens.
 */
export class GetConciliacaoErpUseCase {
  constructor(
    private readonly linhas: IIbcConciliacaoErpRepository,
    private readonly saldoErp: ISaldoIbcErp,
  ) {}

  async execute(input: GetConciliacaoErpInput): Promise<RelatorioConciliacaoErp> {
    assertCanLerConciliacaoErp(input.role);
    const [ibcs, saldo] = await Promise.all([
      this.linhas.listLinhas(),
      this.saldoErp.getSaldo(),
    ]);
    return {
      ...agregarConciliacaoErp(ibcs, saldo),
      itens: input.bucket ? listarItens(ibcs, input.bucket) : [],
    };
  }
}

function listarItens(
  ibcs: readonly IbcLinhaConciliacaoErp[],
  bucket: BucketConciliacaoErp,
): ItemConciliacaoErp[] {
  const itens: ItemConciliacaoErp[] = [];
  for (const ibc of ibcs) {
    const classificacao = classificarBucketConciliacaoErp(ibc);
    if (!pertenceAoRecorte(classificacao, bucket)) continue;
    itens.push(toItem(ibc, classificacao));
  }
  itens.sort((a, b) => a.identificador.localeCompare(b.identificador));
  return itens;
}

function pertenceAoRecorte(
  classificacao: ClassificacaoBucketConciliacaoErp,
  bucket: BucketConciliacaoErp,
): boolean {
  if (bucket === "SERIAL_SEM_NF") return classificacao.serialSemNf;
  return classificacao.bucket === bucket;
}

function toItem(
  ibc: IbcLinhaConciliacaoErp,
  classificacao: ClassificacaoBucketConciliacaoErp,
): ItemConciliacaoErp {
  const comPedido = BUCKETS_COM_PEDIDO.has(classificacao.bucket);
  return {
    id: ibc.id,
    identificador: ibc.identificador,
    bucket: classificacao.bucket,
    custodia: ibc.custodia,
    motivoBaixa: ibc.motivoBaixa,
    aquisicao: ibc.aquisicao,
    cliente: comPedido ? ibc.cliente : null,
    codCli: comPedido ? ibc.codCli : null,
    numPed: comPedido ? ibc.numPed : null,
    emprestimoVenceEm: classificacao.bucket === "NO_CLIENTE" ? ibc.emprestimoVenceEm : null,
    parIdentificador:
      classificacao.bucket === "TROCA"
        ? classificacao.parIdentificador
        : ibc.trocaSaidaIdentificador,
    numeroNf: ibc.numeroNf,
    baixadoEm: ibc.baixadoEm,
  };
}
