export type Pedido = {
  id: string;
  cliente: string;
  cidade: string;
  peso: number;
  vendedor: string;
  precoFrete: number;
  numPed: string;
  // situacao: "pendente" | "alerta" | "atraso";
};

export interface Carga {
  id: string;
  destino: string;
  pesoMax: number;
  pesoAtual: number;
  custoMinimo: number;
  pedidos: Pedido[];
}
