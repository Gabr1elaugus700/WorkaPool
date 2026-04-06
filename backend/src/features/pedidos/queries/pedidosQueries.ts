/**
 * Queries SQL para buscar pedidos do ERP Sapiens.
 * Queries compartilhadas entre diferentes features (cargo, etc).
 */

/**
 * Query base para buscar pedidos do Sapiens.
 * Retorna pedidos com situação 1 (abertos) e transportadora 26.
 */
export const QUERY_GET_PEDIDOS_BASE = `
  SELECT ped.numped          AS [NUM_PED]
        ,ped.codcli          AS [COD_CLI]
        ,cli.nomcli          AS [CLIENTE]
        ,cli.cidcli          AS [CIDADE]
        ,cli.sigufs          AS [ESTADO]
        ,rep.aperep          AS [VENDEDOR]
        ,rep.codrep          AS [CODREP]
        ,ped.pedblo          AS [BLOQUEADO]
        ,sum(ipd.qtdped * der.pesbru) AS [PESO]
        ,ISNULL(grp.desgrp,'OUTROS PRODUTOS') AS [PRODUTOS]
        ,ipd.codder          AS [DERIVACAO]
        ,ipd.qtdped          AS [QUANTIDADE]
        ,ISNULL(CAST(ped.usu_codCar AS INT), 0) AS [CODCAR]
        ,ISNULL(CAST(ped.usu_poscar AS INT), 0) AS [POSCAR]
        ,ped.usu_sitcar      AS [SITCAR]
        ,ped.qtdori AS [QTD_ORI_PED]
  FROM e120ped ped
  LEFT JOIN E120IPD ipd ON ipd.codemp = ped.codemp
                       AND ipd.codfil = ped.codfil
                       AND ipd.numped = ped.numped
  LEFT JOIN e075der der ON der.codemp = ipd.codemp
                       AND der.codpro = ipd.codpro
                       AND der.codder = ipd.codder
  LEFT JOIN e085cli cli ON cli.codcli = ped.codcli
  LEFT JOIN e090rep rep ON rep.codrep = ped.codven
  LEFT JOIN poolbi.dbo.grppro grp ON grp.codpro = ipd.codpro
  WHERE ped.sitped = 1
    AND ped.codtra = 26
`;

export const QUERY_GET_PEDIDOS_GROUP_BY = `
  GROUP BY ped.numped, ped.codcli, cli.nomcli, cli.cidcli, cli.sigufs,
           rep.aperep, rep.codrep, ped.pedblo, ipd.codder, ipd.qtdped,
           grp.desgrp, ped.usu_codCar, ped.usu_poscar, ped.usu_sitcar, ped.qtdori
`;

/**
 * Query para buscar pedidos por representante.
 */
export const QUERY_GET_PEDIDOS_BY_REP = (isAll: boolean) => `
  ${QUERY_GET_PEDIDOS_BASE}
  ${!isAll ? "AND rep.codrep = @codRep" : ""}
  ${QUERY_GET_PEDIDOS_GROUP_BY}
`;

/**
 * Query para buscar peso de um pedido específico.
 */
export const QUERY_GET_PEDIDO_WEIGHT = `
  ${QUERY_GET_PEDIDOS_BASE}
  AND ped.numped = @numPed
  ${QUERY_GET_PEDIDOS_GROUP_BY}
`;

/**
 * Query para buscar pedidos por carga específica.
 */
export const QUERY_GET_PEDIDOS_BY_CARGA = `
  SELECT
       ped.numped          AS [NUM_PED]
      ,ped.codcli          AS [COD_CLI]
      ,cli.nomcli          AS [CLIENTE]
      ,cli.cidcli          AS [CIDADE]
      ,cli.sigufs          AS [ESTADO]
      ,rep.aperep          AS [VENDEDOR]
      ,rep.codrep          AS [CODREP]
      ,ped.pedblo          AS [BLOQUEADO]
      ,sum(ipd.qtdped * der.pesbru) AS [PESO]
      ,ISNULL(grp.desgrp,'OUTROS PRODUTOS') AS [PRODUTOS]
      ,ipd.codder          AS [DERIVACAO]
      ,ipd.qtdped          AS [QUANTIDADE]
      ,ped.usu_codcar      AS [CODCAR]
      ,ped.usu_poscar      AS [POSCAR]
      ,ped.usu_sitcar      AS [SITCAR]
      ,ped.qtdori AS [QTD_ORI_PED]
  FROM e120ped ped
  LEFT JOIN E120IPD ipd ON ipd.codemp = ped.codemp
                       AND ipd.codfil = ped.codfil
                       AND ipd.numped = ped.numped
  LEFT JOIN e075der der ON der.codemp = ipd.codemp
                       AND der.codpro = ipd.codpro
                       AND der.codder = ipd.codder
  LEFT JOIN e085cli cli ON cli.codcli = ped.codcli
  LEFT JOIN e090rep rep ON rep.codrep = ped.codven
  LEFT JOIN poolbi.dbo.grppro grp ON grp.codpro = ipd.codpro
  WHERE ped.sitped = 1
    AND ped.codtra = 26
    AND ped.usu_codcar = @codCar
  GROUP BY ped.numped, ped.codcli, cli.nomcli, cli.cidcli, cli.sigufs,
           rep.aperep, rep.codrep, ped.pedblo, ipd.codder, ipd.qtdped,
           grp.desgrp, ped.usu_codcar, ped.usu_poscar, ped.usu_sitcar, ped.qtdori
`;

/**
 * Query para buscar situação de pedido no Sapiens.
 */
export const QUERY_GET_PEDIDO_SITUACAO = `
  SELECT numped AS [NUM_PED], sitped AS [SIT_PED]
  FROM e120ped
  WHERE numped = @numPed
`;
