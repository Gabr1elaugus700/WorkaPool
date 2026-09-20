-- Canonical lost-orders query for Overview group analysis.
-- Source: user SQL 2026-09-20. Do not restore date BETWEEN or ipd.codpro filter.
SELECT
    ped.datemi AS [DATA],
    ped.numped AS [NUMPED],
    ped.sitped AS [SITUACAO],
    ped.codven AS [CODREP],
    rep.aperep AS [APEREP],
    ped.codcli AS [CODCLI],
    cli.apecli AS [FANTASIA],
    CONCAT(cli.cidcli, ' - ', cli.sigufs) AS [CIDADE],
    ISNULL(grp.desgrp, 'OUTROS PRODUTOS') AS [PRODUTO],
    grp.codgrp AS [CODGRP],
    ipd.qtdped AS [QTDPED],
    ipd.preuni AS [PREUNI],
    ipd.usu_vlrfin AS [VLRFINAL],
    ipd.usu_mgmluc AS [MARGEM_LUCRO]
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
WHERE ped.sitped = '5'
  AND ped.codcli = @codCli
  AND (
        (@codGrp <> 'OUTROS' AND grp.codgrp = @codGrp)
     OR (@codGrp = 'OUTROS' AND grp.codgrp IS NULL)
      )
ORDER BY ped.datemi DESC;
