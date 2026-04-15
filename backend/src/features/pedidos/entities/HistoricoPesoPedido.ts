export interface HistoricoPesoPedido {
  numPed: number;
  peso: number;
  codCar: number;
  createdAt: Date;
}

/**
 * Registro histórico de peso de pedido vinculado a uma carga.
 * Usado para rastrear mudanças de peso durante o processamento logístico.
 */
export class HistoricoPesoPedido {
  constructor(
    public numPed: number,
    public peso: number,
    public codCar: number,
    public createdAt: Date,
  ) {}

  numpedNumber(): number {
    return Number(this.numPed);
  }

  pesoAtual(): number {
    if (isNaN(this.peso) || this.peso === null || this.peso === undefined) {
      throw new Error(`Peso inválido para pedido ${this.numPed}: ${this.peso}`);
    }
    return this.peso;
  }
}
