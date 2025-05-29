export type Pedido = {
  id: string;
  numPed: string;
  cliente: string;
  cidade: string;
  vendedor: string;
  codRep?: number | null; // Código do representante
  bloqueado?: string; // Indica se o pedido está bloqueado
  peso: number;
  precoFrete: number;
  codCar?: number | null;
  produtos?: {
    nome: string;
    derivacao: string;
    peso: number;
  }[];
  sitCar?: string | null; // Situação do pedido na carga
  posCar?: number | null; // Posição do pedido na carga
  
};

export interface Carga {
  id: string;
  destino: string;
  pesoMax: number;
  pesoAtual: number;
  custoMinimo: number;
  previsaoSaida: Date;
  situacao: string;
  codCar: number;
  pedidos: Pedido[];
}

export type RawItem = {
  NUM_PED: number;
  CLIENTE: string;
  CIDADE: string;
  VENDEDOR: string;
  CODREP?: number | null; // Código do representante
  BLOQUEADO?: string; 
  PESO: number;
  DERIVACAO: string;
  PRODUTOS: string;
  CODCAR: number | null;
  POSCAR?: number | null; // Posição do Pedido na Carga
  SITCAR?: string | null; // Situação Do pedido na carga 
};

export type PedidoERP = {
  NUM_PED: string;
  CLIENTE: string;
  CIDADE: string;
  PESO: number;
  VENDEDOR: string;
  BLOQUEADO: string;
  CODCAR: number | null;
  PRODUTOS: string;
  DERIVACAO: string;  
  CODREP?: number | null; // Código do representante
};
