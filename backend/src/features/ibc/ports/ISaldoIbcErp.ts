/**
 * Seam: leitura do saldo fiscal ERP do produto-container IBC (codpro 251001).
 * Somente leitura — nunca write-back de estoque/fiscal no Sapiens.
 *
 * SQL canônica do adapter (e210est):
 *   SELECT COALESCE(SUM(est.qtdest), 0) AS [SALDO]
 *   FROM e210est est
 *   WHERE est.codpro = '251001' AND est.codemp = @codemp
 *
 * Campos: qtdest (quantidade em estoque), codpro (produto), codemp (empresa).
 * Não usar CODIGO_EMBALAGEM / math de embalagem de pedido.
 */
export type SaldoIbcErpResult =
  | { status: "available"; quantity: number }
  | { status: "unavailable" };

export interface ISaldoIbcErp {
  getSaldo(): Promise<SaldoIbcErpResult>;
}
