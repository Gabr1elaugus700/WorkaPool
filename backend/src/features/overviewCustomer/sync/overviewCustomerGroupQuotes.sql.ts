export const OVERVIEW_CUSTOMER_GROUP_QUOTES_SQL = `
SELECT
    ped.datemi AS [DATA],
    ped.numped AS [NUMPED],
    ped.sitped AS [SITUACAO],
    ped.codven AS [CODREP],
    rep.aperep AS [APEREP],
    ped.codcli AS [CODCLI],
    cli.apecli AS [FANTASIA],
    ipd.cplipd AS [NOME_PRO],
    ipd.codpro AS [CODPRO],
    ISNULL(grp.codgrp, '0') AS [CODGRP],
    ipd.usu_vlripi AS [IPI],
    ipd.usu_vlricm AS [ICM],
    ipd.pericm AS [ICMS],
    ipd.qtdped AS [QTDPED],
    ipd.preuni AS [PREUNI],
    ipd.usu_vlrfin AS [VLRFINAL],
    ipd.usu_mgmluc AS [MARGEM_LUCRO],
    ipd.usu_pretab AS [PRE_CUSTO],
    ipd.usu_frepre AS [FRETE],
    ped.codtra AS [TRANSPORTADORA],
    ped.usu_freinc AS [INCLUSO]
FROM e120ped ped
INNER JOIN e120ipd ipd
    ON ipd.codemp = ped.codemp
   AND ipd.codfil = ped.codfil
   AND ipd.numped = ped.numped
INNER JOIN e090rep rep
    ON rep.codrep = ped.codven
INNER JOIN e085cli cli
    ON cli.codcli = ped.codcli
LEFT JOIN poolbi.dbo.grppro grp
    ON grp.codpro = ipd.codpro
WHERE ped.datemi >= @dataInicio
  AND ped.datemi < @dataFimExclusiva
  AND grp.codgrp = @grpPro
  AND ped.sitped IN (9, 5)
`.trim();
