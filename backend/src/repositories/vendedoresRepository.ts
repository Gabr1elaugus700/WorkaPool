import { sqlPool, sqlPoolConnect } from "../database/sqlServer";

export async function vendedores() {
    await sqlPoolConnect;

    const result = await sqlPool.request()
        .query(`
            SELECT rep.codrep AS [COD_REP]
				,rep.nomrep AS [NOME_REP]
				,rep.aperep AS [APE_REP]
            FROM e090rep rep
            WHERE rep.codrep IN (22, 52, 2, 4, 3, 19, 8, 7, 75, 21, 73, 80)
            ORDER BY rep.aperep
        `);
    return result.recordset;
}