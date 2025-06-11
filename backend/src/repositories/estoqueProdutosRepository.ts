import { sqlPool, sqlPoolConnect } from "../database/sqlServer";

export async function GetProdutosEstoque() {
    await sqlPoolConnect;

    const result = await sqlPool.request()  
        .query(`
            SELECT TOP 5 
                grp.desgrp AS [PRODUTO], 
                SUM(est.qtdest) AS [ESTOQUE]
            FROM e210est est
            LEFT JOIN POOLBI.DBO.GRPPRO grp ON grp.codpro = est.codpro
            WHERE est.qtdest > 0 AND grp.desgrp IS NOT NULL
            GROUP BY grp.desgrp
            ORDER BY SUM(est.qtdest) DESC

        `);
    return result.recordset;
}