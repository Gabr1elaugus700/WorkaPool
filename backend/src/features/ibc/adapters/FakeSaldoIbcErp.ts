import {
  ISaldoIbcErp,
  SaldoIbcErpResult,
} from "../ports/ISaldoIbcErp";

type FakeSaldoSource =
  | SaldoIbcErpResult
  | (() => SaldoIbcErpResult | Promise<SaldoIbcErpResult>);

/**
 * Fake do port SaldoIbcErp para CI / unit tests (sem MSSQL).
 */
export class FakeSaldoIbcErp implements ISaldoIbcErp {
  private readonly source: FakeSaldoSource;

  constructor(source: FakeSaldoSource) {
    this.source = source;
  }

  async getSaldo(): Promise<SaldoIbcErpResult> {
    try {
      if (typeof this.source === "function") {
        return await this.source();
      }
      return this.source;
    } catch {
      return { status: "unavailable" };
    }
  }
}
