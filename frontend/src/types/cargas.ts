export type Pedido = {
  id: string;
  numPed: string;
  cliente: string;
  cidade: string;
  vendedor: string;
  peso: number;
  precoFrete: number;
  codCar?: number | null;
  produtos?: {
    nome: string;
    derivacao: string;
    peso: number;
  }[];
};

export interface Carga {
  id: string;
  destino: string;
  pesoMax: number;
  pesoAtual: number;
  custoMinimo: number;
  codCar: number;
  pedidos: Pedido[];
}

