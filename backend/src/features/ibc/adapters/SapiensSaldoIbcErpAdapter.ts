import {
  ISaldoIbcErp,
  SaldoIbcErpResult,
} from "../ports/ISaldoIbcErp";

/** codpro do produto-container no ERP (estoque fiscal) — distinto da math de embalagem. */
export const CODPRO_IBC_CONTAINER = "251001";

export const SALDO_IBC_ERP_QUERY = `
SELECT COALESCE(SUM(est.qtdest), 0) AS [SALDO]
FROM e210est est
WHERE est.codpro = @codpro
  AND est.codemp = @codemp
`.trim();

export type SaldoIbcErpQueryRow = {
  SALDO: number | string | null;
};

export type SaldoIbcErpQueryExecutor = (params: {
  codpro: string;
  codemp: number;
}) => Promise<SaldoIbcErpQueryRow[]>;

type AdapterOptions = {
  executeQuery: SaldoIbcErpQueryExecutor;
  codemp?: number;
};

/**
 * Adapter Sapiens: lê saldo de e210est para CODPRO_IBC_CONTAINER.
 * Falha de query → unavailable (nunca propaga throw ao consumidor do lote).
 */
export class SapiensSaldoIbcErpAdapter implements ISaldoIbcErp {
  private readonly executeQuery: SaldoIbcErpQueryExecutor;
  private readonly codemp: number;

  constructor(options: AdapterOptions) {
    this.executeQuery = options.executeQuery;
    this.codemp = options.codemp ?? 1;
  }

  async getSaldo(): Promise<SaldoIbcErpResult> {
    try {
      const rows = await this.executeQuery({
        codpro: CODPRO_IBC_CONTAINER,
        codemp: this.codemp,
      });
      const raw = rows[0]?.SALDO;
      const quantity = Number(raw ?? 0);
      if (!Number.isFinite(quantity)) {
        return { status: "unavailable" };
      }
      return { status: "available", quantity };
    } catch {
      return { status: "unavailable" };
    }
  }
}
