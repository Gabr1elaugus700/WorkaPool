import sql from "mssql";

/**
 * Tamanhos medidos em poolbi.dbo.grppro (2026-09-18).
 * Usar em .input() parametrizado nos slices de cadastro (write/read pontual).
 */
export const GRPPRO_COLUMN_LENGTHS = {
  CODGRP: 10,
  DESGRP: 100,
  CODPRO: 10,
} as const;

export const GRPPRO_MSSQL_TYPES = {
  CODGRP: sql.NVarChar(GRPPRO_COLUMN_LENGTHS.CODGRP),
  DESGRP: sql.NVarChar(GRPPRO_COLUMN_LENGTHS.DESGRP),
  CODPRO: sql.NVarChar(GRPPRO_COLUMN_LENGTHS.CODPRO),
} as const;
