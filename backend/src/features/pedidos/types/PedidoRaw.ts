/**
 * DTO bruto retornado pelo SQL — uma linha por produto/derivação.
 * Representa o formato "raw" antes da agregação por número de pedido.
 *
 * Campos IBC (CODIGO_EMBALAGEM, VOLUME_EMBALAGEM, INCLUSO) vêm só de
 * QUERY_GET_PEDIDOS_BY_CARGA — opcionais nas demais queries.
 * QUANTIDADE mapeia ipd.qtdped (QUANTIDADE_PEDIDO no domínio IBC).
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
  /** der.usu_codemb — 251001 = linha container IBC */
  CODIGO_EMBALAGEM?: number | string | null;
  /** der.usu_qtdmve — divisor da fórmula de containers */
  VOLUME_EMBALAGEM?: number | string | null;
  /** ipd.usu_embinc — S = Venda; demais = Empréstimo (só em 251001) */
  INCLUSO?: string | null;
};
