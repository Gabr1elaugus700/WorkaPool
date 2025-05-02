import { sqlPool, sqlPoolConnect } from "../database/sqlServer";

export async function buscarFaturamentoVendedor(codRep: number, dataInicio: Date) {
  await sqlPoolConnect;

  const result = await sqlPool.request()
    .input('codRep', codRep)
    .input('dataInicio', dataInicio)
    .query(`
      SELECT 
        SUM(CASE WHEN ipv.codpro = '101072' THEN (ipv.qtdfat - ipv.qtddev) / 2 ELSE (ipv.qtdfat - ipv.qtddev) END) AS [QUANT],
        SUM(ipv.preuni * (ipv.qtdfat - ipv.qtddev)) AS [TOTAL],
        rep.aperep AS [VENDEDOR],
        rep.codrep AS [COD_REP]
      FROM e140ipv ipv
      LEFT JOIN e140nfv nfv 
        ON nfv.numnfv = ipv.numnfv 
        AND nfv.codemp = ipv.codemp     
        AND nfv.codfil = ipv.codfil 
        AND nfv.codsnf = ipv.codsnf
      LEFT JOIN e120ipd ipd 
        ON ipd.codemp = ipv.codemp 
        AND ipd.codfil = ipv.codfil 
        AND ipd.numped = ipv.numped 
        AND ipd.seqipd = ipv.seqipd
      LEFT JOIN e120ped ped 
        ON ped.codemp = ipd.codemp 
        AND ped.codfil = ipd.codfil 
        AND ped.numped = ipd.numped
      LEFT JOIN e090rep rep 
        ON rep.codrep = ped.codven
      LEFT JOIN e001tns tns 
        ON tns.codemp = ipv.codemp 
        AND tns.codtns = ipv.tnspro
      LEFT JOIN e085cli cli 
        ON cli.codcli = nfv.codcli
      LEFT JOIN e026ram ram 
        ON ram.codram = cli.codram
      LEFT JOIN poolbi.dbo.grppro grp 
        ON grp.codpro = ipv.codpro
      WHERE 
        nfv.datemi >= @dataInicio
        AND nfv.sitnfv = 2 
        AND tns.venfat = 'S'
        AND ipv.codemp = 1 
        AND rep.codrep = @codRep
      GROUP BY rep.aperep, rep.codrep
    `);

  return result.recordset;
}
