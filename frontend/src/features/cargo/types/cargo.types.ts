// ==========================================
// TIPOS QUE VÊM DO BACKEND (API Response)
// ==========================================

/** Resposta da API para Carga */
export interface CargaResponseDTO {
  id: string;
  codCar: number;
  destino: string;
  pesoMaximo: number;  // Backend retorna pesoMaximo, não pesoMax
  previsaoSaida: string;  // ISO string
  situacao: "ABERTA" | "FECHADA" | "CANCELADA" | "SOLICITADA" | "ENTREGUE";
  createdAt: string;  // ISO string
  closedAt?: string;  // ISO string
}

/** Resposta da API para Carga com peso calculado */
export interface CargaComPesoDTO extends CargaResponseDTO {
  pesoAtual: number;       // Peso total de TODOS os pedidos da carga
  quantidadePedidos: number;  // Número de pedidos na carga
}

/** Resposta da API para Pedido (após agrupamento) */
export interface PedidoResponseDTO {
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
  poscar?: number | null;  // Backend retorna poscar (minúsculo)
  sitcar?: string | null;  // Backend retorna sitcar (minúsculo)
  produtos?: {
    nome: string;
    derivacao: string;
    quantidade: number;  // Backend inclui quantidade
    peso: number;
  }[];
}

// ==========================================
// TIPOS PARA USO NO FRONTEND
// ==========================================

/** Pedido com campos normalizados para o frontend */
export interface Pedido {
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
  precoFrete: number;
  codCar?: number | null;
  poscar?: number | null;  // Mantém lowercase para compatibilidade com backend
  sitcar?: string | null;  // Mantém lowercase para compatibilidade com backend
  produtos?: {
    nome: string;
    derivacao: string;
    quantidade: number;
    peso: number;
  }[];
}

export enum CargaSituacao {
  ABERTA = "ABERTA",
  FECHADA = "FECHADA",
  CANCELADA = "CANCELADA",
  SOLICITADA = "SOLICITADA",
  ENTREGUE = "ENTREGUE",
}
/** Carga com campos calculados para o frontend */
export interface Carga {
  id: string;
  codCar: number;
  destino: string;
  pesoMaximo: number;  // Normalizado para pesoMaximo
  pesoAtual: number;  // Calculado no frontend
  previsaoSaida: string;
  situacao: CargaSituacao;
  createdAt: string;
  closedAt?: string;
  pedidos: Pedido[];
}



// ==========================================
// TIPOS LEGADOS (para compatibilidade)
// ==========================================

export type CargaUpdate = Omit<Carga, 'pedidos'>;

/** Formato raw do SQL - uma linha por produto */
export type RawItem = {
  NUM_PED: number;
  COD_CLI: string;
  CLIENTE: string;
  CIDADE: string;
  ESTADO: string;
  VENDEDOR: string;
  CODREP?: number | null;
  BLOQUEADO?: string; 
  PESO: number;
  DERIVACAO: string;
  PRODUTOS: string;
  QUANTIDADE: number;
  CODCAR: number | null;
  POSCAR: number;
  SITCAR?: string | null;
};

export type PedidoERP = {
  NUM_PED: string;
  COD_CLI: string;
  CLIENTE: string;
  CIDADE: string;
  ESTADO: string;
  PESO: number;
  VENDEDOR: string;
  BLOQUEADO: string;
  PRODUTOS: string;
  DERIVACAO: string;
  QUANTIDADE: number;
  CODREP?: number | null;
  CODCAR: number | null;
  POSCAR: number;
  SITCAR?: string | null;
};

export interface CargaFechada {
  id: string;
  cargaId: string;
  carga: Carga;
  pedidos: Array<{ id: number }>; 
}

// ==========================================
// HELPERS
// ==========================================

/** Converte CargaResponseDTO para Carga do frontend */
export function toCarga(dto: CargaResponseDTO, pedidos: Pedido[] = []): Carga {
  return {
    id: dto.id,
    codCar: dto.codCar,
    destino: dto.destino,
    pesoMaximo: dto.pesoMaximo,
    pesoAtual: pedidos.reduce((sum, p) => sum + p.peso, 0),  // Calculado
    previsaoSaida: dto.previsaoSaida,
    situacao: dto.situacao as CargaSituacao,
    createdAt: dto.createdAt,
    closedAt: dto.closedAt,
    pedidos,
  };
}

/** Converte PedidoResponseDTO para Pedido do frontend */
export function toPedido(dto: PedidoResponseDTO): Pedido {
  return {
    id: dto.id,
    numPed: dto.numPed,
    codCli: dto.codCli,
    cliente: dto.cliente,
    cidade: dto.cidade,
    estado: dto.estado,
    vendedor: dto.vendedor,
    codRep: dto.codRep,
    bloqueado: dto.bloqueado,
    peso: dto.peso,
    precoFrete: dto.precoFrete ?? 0,
    codCar: dto.codCar,
    poscar: dto.poscar,
    sitcar: dto.sitcar,
    produtos: dto.produtos,
  };
}
