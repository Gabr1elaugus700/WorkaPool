export interface Pedido {
  id: string;
  cliente: string;
  cidade: string;
  peso: number;
  vendedor: string;
  precoFrete: number;
  numPed: string;
  situacao: 'atraso' | 'pendente' | 'alerta'
}

export interface Carga {
  id: string;
  destino: string;
  pesoMax: number;
  pesoAtual: number;
  custoMinimo: number;
  pedidos: Pedido[];
}
