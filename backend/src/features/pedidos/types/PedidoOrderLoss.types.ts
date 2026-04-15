import { PedidoBase, PedidoBaseProps } from '../entities/PedidoBase';

/**
 * Props específicas do contexto OrderLoss (comercial/vendas).
 */
export interface PedidoOrderLossProps extends PedidoBaseProps {
  dataPedido: Date;
  situacao: string;
  fantasia: string;
  codPro: string;
  produto: string;
  qtdPedido: number;
  precoUnitario: number;
  vlrFinal: number;
  margemLucro: number;
  vlrFrete: number;
  ipi: number;
  icms: number;
}

/**
 * Extensão de Pedido para o contexto de OrderLoss (análise comercial).
 * Adiciona propriedades relacionadas a precificação, margem e análise de perdas.
 */
export class PedidoOrderLoss extends PedidoBase {
  public dataPedido: Date;
  public situacao: string;
  public fantasia: string;
  public codPro: string;
  public produto: string;
  public qtdPedido: number;
  public precoUnitario: number;
  public vlrFinal: number;
  public margemLucro: number;
  public vlrFrete: number;
  public ipi: number;
  public icms: number;

  constructor({
    dataPedido,
    situacao,
    fantasia,
    codPro,
    produto,
    qtdPedido,
    precoUnitario,
    vlrFinal,
    margemLucro,
    vlrFrete,
    ipi,
    icms,
    ...baseProps
  }: PedidoOrderLossProps) {
    super(baseProps);
    this.dataPedido = dataPedido;
    this.situacao = situacao;
    this.fantasia = fantasia;
    this.codPro = codPro;
    this.produto = produto;
    this.qtdPedido = qtdPedido;
    this.precoUnitario = precoUnitario;
    this.vlrFinal = vlrFinal;
    this.margemLucro = margemLucro;
    this.vlrFrete = vlrFrete;
    this.ipi = ipi;
    this.icms = icms;
  }
}
