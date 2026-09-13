WITH BaseVendas AS (
    SELECT
        nfv.datemi AS Emissao,
        cli.codcli AS CodCli,
        ipv.numped AS NumPed,

        CASE
            WHEN ipv.codfil = 1 THEN 'MGA'
            ELSE 'CTB'
        END AS Fil,

        CASE
            WHEN ipv.codpro = '101072'
                THEN (ipv.qtdfat - ipv.qtddev) / 2.0
            ELSE (ipv.qtdfat - ipv.qtddev)
        END AS Volume,

        ipv.preuni * (ipv.qtdfat - ipv.qtddev) AS VlrFat,

        ipd.usu_mgmluc AS Margem,

        ipv.codpro AS CodPro

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

    LEFT JOIN e001tns tns
        ON tns.codemp = ipv.codemp
        AND tns.codtns = ipv.tnspro

    LEFT JOIN e085cli cli
        ON cli.codcli = nfv.codcli

    WHERE
        ped.numped > 0
        AND nfv.sitnfv = 2
        AND tns.venfat = 'S'
        AND ipv.qtdfat > ipv.qtddev
        
        AND nfv.datemi >= '2024-01-01'

        -- Para consultar apenas um cliente:
        -- AND cli.codcli = @CodCli
),

PedidosCliente AS (
    SELECT
        CodCli,
        NumPed,

        YEAR(Emissao) AS Ano,
        MONTH(Emissao) AS Mes,

        MIN(Emissao) AS Emissao,

        SUM(VlrFat) AS VlrPedido,

        SUM(Volume) AS VolumePedido,

        AVG(Margem) AS MargemMediaPedido

    FROM BaseVendas

    GROUP BY
        CodCli,
        NumPed,
        YEAR(Emissao),
        MONTH(Emissao)
),

EvolucaoMensal AS (
    SELECT
        CodCli,

        Ano,
        Mes,

        SUM(VlrPedido) AS Faturamento,

        SUM(VolumePedido) AS Volume,

        COUNT(*) AS QuantidadePedidos,

        AVG(MargemMediaPedido) AS Margem,

        AVG(VlrPedido) AS TicketMedio

    FROM PedidosCliente

    GROUP BY
        CodCli,
        Ano,
        Mes
),

ProdutosMensais AS (
    SELECT
        CodCli,

        YEAR(Emissao) AS Ano,
        MONTH(Emissao) AS Mes,

        COUNT(DISTINCT CodPro) AS QuantidadeProdutos

    FROM BaseVendas

    GROUP BY
        CodCli,
        YEAR(Emissao),
        MONTH(Emissao)
)

SELECT
    e.CodCli,

    e.Ano,

    e.Mes,

    ROUND(e.Faturamento, 2) AS Faturamento,

    ROUND(e.Volume, 2) AS Volume,

    e.QuantidadePedidos,

    ROUND(e.Margem, 2) AS Margem,

    p.QuantidadeProdutos,

    ROUND(e.TicketMedio, 2) AS TicketMedio

FROM EvolucaoMensal e

LEFT JOIN ProdutosMensais p
    ON p.CodCli = e.CodCli
    AND p.Ano = e.Ano
    AND p.Mes = e.Mes

ORDER BY
    e.CodCli,
    e.Ano,
    e.Mes;

