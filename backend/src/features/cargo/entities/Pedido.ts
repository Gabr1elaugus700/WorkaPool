export interface PedidoProps {
  id: string;
  numPed: string;
  codCli?: string;
  cliente: string;
  cidade: string;
  estado?: string;
  vendedor: string;
  codRep?: number;
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

export class Pedido {
  public readonly id: string;
  public numPed: string;
  public codCli?: string;
  public cliente: string;
  public cidade: string;
  public estado?: string;
  public vendedor: string;
  public codRep?: number;
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
    id,
    numPed,
    codCli,
    cliente,
    cidade,
    estado,
    vendedor,
    codRep,
    bloqueado,
    peso,
    precoFrete,
    codCar,
    poscar,
    sitcar,
    produtos,
    qtdOri,
  }: PedidoProps) {
    this.id = id;
    this.numPed = numPed;
    this.codCli = codCli;
    this.cliente = cliente;
    this.cidade = cidade;
    this.estado = estado;
    this.vendedor = vendedor;
    this.codRep = codRep;
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

/** DTO bruto retornado pelo SQL — uma linha por produto/derivação */
export type PedidoRaw = {
  NUM_PED: string;
  COD_CLI: string;
  CLIENTE: string;
  CIDADE: string;
  ESTADO: string;
  VENDEDOR: string;
  CODREP: number;
  BLOQUEADO: string;
  PESO: number;
  PRODUTOS: string;
  DERIVACAO: string;
  QUANTIDADE: number;
  CODCAR: number;
  POSCAR: number;
  SITCAR: string;
  QTD_ORI_PED: number;
}