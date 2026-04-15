/**
 * DTO bruto retornado pelo SQL — uma linha por produto/derivação.
 * Representa o formato "raw" antes da agregação por número de pedido.
 */
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
};
