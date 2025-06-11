import { sqlPool, sqlPoolConnect } from "../database/sqlServer";

export async function BuscarClientesInativos(
  dataInicio: string,
  dataFim: string,
  codRep: number,
  diasSCompra: number
) {

  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasSCompra)
  const dataLimiteFormatada = dataLimite.toISOString().split("T")[0] // 'YYYY-MM-DD'


  await sqlPoolConnect;

  const result = await sqlPool.request()
    .input("dataInicio", dataInicio)
    .input("dataFim", dataFim)
    .input("codRep", codRep)
    .input("dataLimite", dataLimiteFormatada)
    .query(`
      SELECT 
        cli.codcli,
        cli.nomcli,
        cli.foncli,
        rep.aperep AS vendedor,
        rep.codrep,
        ISNULL(grp.desgrp, 'OUTROS PRODUTOS') AS produto,
        sum(ipv.qtdfat) AS [KG_TOTAL_PERIODO]
      FROM e140ipv ipv
      LEFT JOIN e140nfv nfv ON nfv.codemp = ipv.codemp 
                            AND nfv.codfil = ipv.codfil 
                            AND nfv.codsnf = ipv.codsnf 
                            AND nfv.numnfv = ipv.numnfv
      LEFT JOIN e001tns tns ON tns.codemp = ipv.codemp 
                            AND tns.codtns = ipv.tnspro
      LEFT JOIN e085cli cli ON cli.codcli = nfv.codcli
      LEFT JOIN e085hcl hcl ON hcl.codemp = nfv.codemp
                            AND hcl.codfil = nfv.codfil
                            AND hcl.codcli = cli.codcli
      LEFT JOIN e120ipd ipd ON ipd.codemp = ipv.codemp 
                            AND ipd.codfil = ipv.codfil 
                            AND ipd.numped = ipv.numped 
                            AND ipd.seqipd = ipv.seqipd
      LEFT JOIN e120ped ped ON ped.codemp = ipd.codemp 
                            AND ped.codfil = ipd.codfil 
                            AND ped.numped = ipd.numped
      LEFT JOIN e090rep rep ON rep.codrep = hcl.codven
      LEFT JOIN e026ram ram ON ram.codram = cli.codram
      LEFT JOIN poolbi.dbo.grppro grp ON grp.codpro = ipv.codpro									
      WHERE 
        nfv.sitnfv = 2 AND
        nfv.datemi BETWEEN @dataInicio AND @dataFim AND
        tns.venfat = 'S' AND
        cli.tipcli = 'J' AND
        rep.codrep = @codRep AND
        cli.codcli NOT IN (
          SELECT DISTINCT codcli FROM e140nfv WHERE datemi >= @dataLimite
        ) AND
        cli.codcli NOT IN (
          SELECT codcli FROM e301tcr WHERE codcrt = '15'
        )
      GROUP BY 
        cli.codcli, cli.nomcli, cli.foncli,
        rep.aperep, rep.codrep,
        ISNULL(grp.desgrp, 'OUTROS PRODUTOS')

      HAVING 
        SUM(ipv.qtdfat) > 1000
    `)

  return result.recordset
}
