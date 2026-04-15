export type Pedido = {
  id: string;
  numPed: string;
  codCli: string;
  cliente: string;
  cidade: string;
  estado: string;
  vendedor: string;
  codRep: number;
  bloqueado?: string; // Indica se o pedido está bloqueado
  peso: number;
  //   precoFrete: number;
  codCar?: number | null;
  posCar?: number | null; // Posição do pedido na carga
  sitCar?: string | null; // Situação do pedido na carga
  produtos?: {
    nome: string;
    derivacao: string;
    peso: number;
    quantidade: number;
  }[];
};
