import { ISaldoIbcErp, SaldoIbcErpResult } from "../ports/ISaldoIbcErp";

/**
 * Wrapper fino do port para consumidores (#117 lote).
 * Distingue available vs unavailable sem lançar.
 */
export class GetSaldoIbcErpUseCase {
  private readonly saldoPort: ISaldoIbcErp;

  constructor(saldoPort: ISaldoIbcErp) {
    this.saldoPort = saldoPort;
  }

  async execute(): Promise<SaldoIbcErpResult> {
    return this.saldoPort.getSaldo();
  }
}
