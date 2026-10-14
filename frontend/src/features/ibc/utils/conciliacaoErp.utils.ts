import { formatIsoDateLabel } from "@/utils/formatDate";
import { formatNumber } from "@/utils/formatNumber";
import type {
  BucketConsultaConciliacaoErp,
  ItemConciliacaoErp,
  SaldoErpConciliacao,
} from "../types/conciliacaoErp.types";

const ROTULOS = {
  PATIO: "Pátio", EM_VIAGEM: "Em viagem", ENTRADA: "Entrada no pátio",
  NO_CLIENTE: "No cliente", VENDIDOS: "Vendidos", TROCA: "Troca",
  BAIXADOS: "Baixados", SUBSTITUIDOS: "Substituídos", SERIAL_SEM_NF: "Seriais sem NF",
} as const satisfies Record<BucketConsultaConciliacaoErp, string>;

type Coluna = "cliente" | "pedido" | "vencimento" | "par" | "nf" | "baixa";

const COLUNAS: Partial<Record<BucketConsultaConciliacaoErp, readonly Coluna[]>> = {
  NO_CLIENTE: ["cliente", "pedido", "vencimento"],
  VENDIDOS: ["cliente", "pedido"],
  TROCA: ["cliente", "pedido", "par"],
  BAIXADOS: ["baixa"],
};

const ROTULO_COLUNA: Record<Coluna, string> = {
  cliente: "Cliente", pedido: "Pedido", vencimento: "Vencimento do empréstimo",
  par: "Par da troca", nf: "NF", baixa: "Data da baixa",
};

function dia(value: string | null): string | null {
  const prefixo = value?.slice(0, 10) ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(prefixo) ? prefixo : null;
}

export const conciliacaoErpApresentacao = {
  buckets: Object.keys(ROTULOS) as BucketConsultaConciliacaoErp[],
  isBucket(value: string | null): value is BucketConsultaConciliacaoErp {
    return value != null && Object.prototype.hasOwnProperty.call(ROTULOS, value);
  },
  rotuloBucket(bucket: BucketConsultaConciliacaoErp): string {
    return ROTULOS[bucket];
  },
  saldo(saldo: SaldoErpConciliacao): string {
    return saldo.status === "available" ? formatNumber(saldo.quantity) : "indisponível";
  },
  residual(residual: number | null): string {
    if (residual == null) return "indisponível";
    return residual > 0 ? `+${formatNumber(residual)}` : formatNumber(residual);
  },
  colunas(bucket: BucketConsultaConciliacaoErp, itens: readonly ItemConciliacaoErp[]): Coluna[] {
    const colunas: Coluna[] = [...(COLUNAS[bucket] ?? [])];
    if (!colunas.includes("nf") && itens.some((item) => item.numeroNf)) colunas.push("nf");
    return colunas;
  },
  rotuloColuna(coluna: Coluna): string {
    return ROTULO_COLUNA[coluna];
  },
  celula(item: ItemConciliacaoErp, coluna: Coluna): string {
    if (coluna === "cliente") return item.cliente ?? item.codCli ?? "Não informado";
    if (coluna === "pedido") return item.numPed ?? "Não informado";
    if (coluna === "vencimento") return formatIsoDateLabel(dia(item.emprestimoVenceEm));
    if (coluna === "par") return item.parIdentificador ?? "Não informado";
    if (coluna === "nf") return item.numeroNf ?? "Não informado";
    return formatIsoDateLabel(dia(item.baixadoEm));
  },
};
