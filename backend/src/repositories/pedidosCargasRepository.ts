import { sqlPool, sqlPoolConnect } from "../database/sqlServer";

export async function buscarPedidosPorCarga(codCar: number) {
    await sqlPoolConnect;

    const result = await sqlPool.request()
        .input('codCar', codCar)
        .query(`
            SELECT ped.numped AS [NUM_PED]
				,ped.codcli AS [COD_CLI]
				,cli.nomcli AS [CLIENTE]
				,cli.cidcli AS [CIDADE]
				,cli.sigufs AS [ESTADO]
				,rep.aperep AS [VENDEDOR]
				,rep.codrep AS [COD_VEN]
				,ped.pedblo AS [BLOQUEADO]
				,sum(ipd.qtdped * der.pesbru) AS [PESO]
				,ISNULL(grp.desgrp,'OUTROS PRODUTOS') AS [PRODUTOS]
				,ipd.codder AS [DERIVACAO]
				,ipd.qtdped AS [QUANTIDADE]
				,ped.usu_codcar AS [CODCAR]
                ,ped.usu_poscar AS [POSCAR]
                ,ped.usu_sitcar AS [SITCAR]
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
            WHERE PED.sitped = 1
            AND ped.codtra = 26
            and ped.usu_codcar=@codCar 
            GROUP BY ped.numped, ped.codcli, cli.nomcli, cli.cidcli, cli.sigufs, rep.aperep, rep.codrep, ped.pedblo ,ipd.codder ,ipd.qtdped, grp.desgrp, ped.usu_codcar, ped.usu_poscar, ped.usu_sitcar`);
    return result.recordset;
}