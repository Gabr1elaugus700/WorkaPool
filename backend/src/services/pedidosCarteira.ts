import { sqlPool, sqlPoolConnect } from "../database/sqlServer";

export async function getPedidosCarteira() {
    await sqlPoolConnect;

    const result = await sqlPool.request().query(`
        SELECT rep.aperep AS [VENDEDOR]
				--,isnull(grp.CODGRP,'G099') AS  [CODGRU]
				,isnull(grp.DESGRP,'OUTROS PRODUTOS') AS [GRUPO]
				,convert( NUMERIC (12,0), sum(ipd.qtdped) ) AS  [QUANTIDADE]
				,sum(ipd.preuni * ipd.qtdped) AS [VALOR]
        FROM e120ipd ipd 
        LEFT JOIN  e120ped ped ON  ped.codemp = ipd.codemp AND  ped.codfil = ipd.codfil AND  ped.numped = ipd.numped
        LEFT  JOIN  e090rep rep ON  rep.codrep = ped.codven
        LEFT  JOIN poolbi.dbo.grppro grp ON  grp.CODPRO = ipd.codpro
        LEFT JOIN e140ipv ipv ON ipv.codemp = ipd.codemp AND ipv.codfil = ipd.codfil AND ipv.numped = ipd.numped AND ipv.seqipv = ipd.seqipd
        LEFT JOIN e140nfv nfv ON nfv.numnfv = ipv.numnfv AND nfv.codsnf = ipv.codsnf AND nfv.codemp = ipv.codemp AND nfv.codfil = ipv.codfil
        where ipd.codemp = 1
        and ipd.sitipd = 1
        AND ped.datemi >= '01/04/2025'
        AND ped.tnspro <> '90150'
        group by rep.aperep, isnull(grp.CODGRP,'G099'), isnull(grp.DESGRP,'OUTROS PRODUTOS'), ipd.preuni, ipd.qtdped
        `)
    return result.recordset
}