export interface PedidoBaseProps {
  id: string;
  numPed: string;
  codCli?: string;
  cliente: string;
  cidade: string;
  estado?: string;
  vendedor: string;
  codRep?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidade base para pedidos.
 * Contém propriedades compartilhadas entre diferentes contextos (cargo, orderLoss).
 */
export class PedidoBase {
  public readonly id: string;
  public numPed: string;
  public codCli?: string;
  public cliente: string;
  public cidade: string;
  public estado?: string;
  public vendedor: string;
  public codRep?: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor({
    id,
    numPed,
    codCli,
    cliente,
    cidade,
    estado,
    vendedor,
    codRep,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: PedidoBaseProps) {
    this.id = id;
    this.numPed = numPed;
    this.codCli = codCli;
    this.cliente = cliente;
    this.cidade = cidade;
    this.estado = estado;
    this.vendedor = vendedor;
    this.codRep = codRep;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
