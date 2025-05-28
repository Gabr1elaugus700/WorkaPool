export type Pedido = {
  id: string;
  numPed: string;
  cliente: string;
  cidade: string;
  vendedor: string;
  codRep?: number | null; // Código do representante
  bloqueado?: string;
  peso: number;
  precoFrete: number;
  codCar?: number | null;
  produtos?: {
    nome: string;
    derivacao: string;
    peso: number;
  }[];
};

export type PedidosFechados = {
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
}