import { PedidoBase, PedidoBaseProps } from '../../pedidos/entities/PedidoBase';

export interface PedidoProps extends PedidoBaseProps {
  bloqueado?: string;
  peso: number;
  precoFrete?: number;
  codCar?: number | null;
  poscar?: number | null;
  sitcar?: string | null;
  qtdOri: number;
  produtos?: {
    nome: string;
    derivacao: string;
    quantidade: number;
    peso: number;
  }[];
}

export class Pedido extends PedidoBase {
  public bloqueado?: string;
  public peso: number;
  public precoFrete?: number;
  public codCar?: number | null;
  public poscar?: number | null;
  public sitcar?: string | null;
  public qtdOri: number;
  public produtos?: {
    nome: string;
    derivacao: string;
    quantidade: number;
    peso: number;
  }[];

  constructor({
    bloqueado,
    peso,
    precoFrete,
    codCar,
    poscar,
    sitcar,
    produtos,
    qtdOri,
    ...baseProps
  }: PedidoProps) {
    super(baseProps);
    this.bloqueado = bloqueado;
    this.peso = peso;
    this.precoFrete = precoFrete;
    this.codCar = codCar;
    this.poscar = poscar;
    this.sitcar = sitcar;
    this.produtos = produtos;
    this.qtdOri = qtdOri;
  }
}

export type { PedidoRaw, SimulacaoPedidoNaCarga } from '../../pedidos';
export { HistoricoPesoPedido } from '../../pedidos';