import { Carga } from "./cargas";

export interface CargaFechada {
  id: string;
  cargaId: string;
  carga: Carga;
  pedidos: Array<{ id: number }>; 
}