export type Pedido = {
  id: string;
  cliente: string;
  cidade: string;
  peso: number;
  vendedor: string;
  precoFrete: number;
  numPed: string;
  codCar: number  | null; // Pode ser null se não estiver alocado a uma carga
  // situacao: "pendente" | "alerta" | "atraso";
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
