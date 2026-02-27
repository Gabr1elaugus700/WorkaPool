import { v4 as uuid } from "uuid";

export interface CargaProps {
  id?: string;
  codCar: number;
  pesoMaximo: number;
  previsaoSaida: Date;
  destino: string;
  dataCriacao?: Date;
  createdAt?: Date;
  closedAt?: Date;
  situacao: SituacaoCarga;
}

export enum SituacaoCarga {
  ABERTA = "ABERTA",
  FECHADA = "FECHADA",
  CANCELADA = "CANCELADA",
  SOLICITADA = "SOLICITADA",
  ENTREGUE = "ENTREGUE",
}

export class Carga {
  public readonly id: string;
  public codCar: number;
  public destino: string;
  public pesoMaximo: number;
  public previsaoSaida: Date;
  public situacao: SituacaoCarga;
  public createdAt: Date;
  public closedAt?: Date;

  constructor({
    id,
    codCar,
    destino,
    createdAt,
    closedAt,
    pesoMaximo,
    previsaoSaida,
    situacao,
  }: CargaProps) {
    this.id = id ?? uuid();
    this.codCar = codCar;
    this.destino = destino;
    this.pesoMaximo = pesoMaximo;
    this.previsaoSaida = previsaoSaida;
    this.createdAt = createdAt ?? new Date();
    this.closedAt = closedAt;
    this.situacao = situacao;
  }
}
