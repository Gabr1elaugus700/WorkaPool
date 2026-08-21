import { PedidoBase, PedidoBaseProps } from '../entities/PedidoBase';
import type { PedidoIbcEligibility } from '../mappers/computePedidoIbcEligibility';

/**
 * Produto dentro de um pedido (contexto cargo/logística).
 */
export interface ProdutoPedido {
  nome: string;
  derivacao: string;
  quantidade: number;
  peso: number;
}

/**
 * Simulação de alocação de pedido em carga.
 * Usado para verificar se pedido cabe na carga disponível.
 */
export interface SimulacaoPedidoNaCarga {
  pesoAnteriorConsiderado: number;
  pesoAtualPedido: number;
  pesoUsadoAtual: number;
  novoPesoUsado: number;
  pesoDisponivelAtual: number;
  pesoDisponivelAposTroca: number;
  cabeNaCarga: boolean;
  excesso: number;
}

/**
 * Props específicas do contexto Cargo (logística).
 */
export interface PedidoCargoProps extends PedidoBaseProps {
  bloqueado?: string;
  peso: number;
  precoFrete?: number;
  codCar?: number | null;
  poscar?: number | null;
  sitcar?: string | null;
  qtdOri: number;
  produtos?: ProdutoPedido[];
  isContainer?: boolean;
  quantidadeEsperadaTotal?: number;
  quantidadeEsperadaVenda?: number;
  quantidadeEsperadaEmprestimo?: number;
  ibcInvalido?: boolean;
}

/**
 * Extensão de Pedido para o contexto de Cargo (logística).
 * Adiciona propriedades relacionadas a peso, carga, produtos e elegibilidade IBC.
 */
export class PedidoCargo extends PedidoBase {
  public bloqueado?: string;
  public peso: number;
  public precoFrete?: number;
  public codCar?: number | null;
  public poscar?: number | null;
  public sitcar?: string | null;
  public qtdOri: number;
  public produtos?: ProdutoPedido[];
  public isContainer: boolean;
  public quantidadeEsperadaTotal: number;
  public quantidadeEsperadaVenda: number;
  public quantidadeEsperadaEmprestimo: number;
  /** Pedido IBC inválido — sinal de alerta ALMOX; bloqueia AlocacaoIbc neste Pedido. */
  public ibcInvalido: boolean;

  constructor({
    bloqueado,
    peso,
    precoFrete,
    codCar,
    poscar,
    sitcar,
    qtdOri,
    produtos,
    isContainer = false,
    quantidadeEsperadaTotal = 0,
    quantidadeEsperadaVenda = 0,
    quantidadeEsperadaEmprestimo = 0,
    ibcInvalido = false,
    ...baseProps
  }: PedidoCargoProps) {
    super(baseProps);
    this.bloqueado = bloqueado;
    this.peso = peso;
    this.precoFrete = precoFrete;
    this.codCar = codCar;
    this.poscar = poscar;
    this.sitcar = sitcar;
    this.qtdOri = qtdOri;
    this.produtos = produtos;
    this.isContainer = isContainer;
    this.quantidadeEsperadaTotal = quantidadeEsperadaTotal;
    this.quantidadeEsperadaVenda = quantidadeEsperadaVenda;
    this.quantidadeEsperadaEmprestimo = quantidadeEsperadaEmprestimo;
    this.ibcInvalido = ibcInvalido;
  }

  applyIbcEligibility(eligibility: PedidoIbcEligibility): void {
    this.isContainer = eligibility.isContainer;
    this.quantidadeEsperadaTotal = eligibility.quantidadeEsperadaTotal;
    this.quantidadeEsperadaVenda = eligibility.quantidadeEsperadaVenda;
    this.quantidadeEsperadaEmprestimo =
      eligibility.quantidadeEsperadaEmprestimo;
    this.ibcInvalido = eligibility.ibcInvalido;
  }
}
