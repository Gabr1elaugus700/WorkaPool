import { sqlPool, sqlPoolConnect } from "../database/sqlServer";

export async function produtos() {
    await sqlPoolConnect;

    const result = await sqlPool.request()
        .query(`
            SELECT  codgrp AS [COD_GRUPO]
				,desgrp AS [PRODUTOS]
            FROM poolbi.dbo.grppro
            GROUP BY desgrp, codgrp
            HAVING COUNT(*) > 1
        `);
    return result.recordset;        
}