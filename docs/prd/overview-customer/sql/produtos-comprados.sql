
WITH BaseVendas AS (
    SELECT
        nfv.datemi AS Emissao,
        cli.codcli AS CodCli,
        ipv.numped AS NumPed,
        ipv.codpro AS CodPro,
        ipv.cplipv AS Produto,

        CASE
            WHEN ipv.codfil = 1 THEN 'MGA'
            ELSE 'CTB'
        END AS Fil,

        CASE
            WHEN ipv.codpro = '101072'
                THEN (ipv.qtdfat - ipv.qtddev) / 2.0
            ELSE (ipv.qtdfat - ipv.qtddev)
        END AS Volume,

        ipv.preuni AS PrecoUnitario,

        ipv.preuni * (ipv.qtdfat - ipv.qtddev) AS VlrFat,

        ipd.usu_mgmluc AS Margem

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

        -- Histórico a partir de 01/01/2024
        AND nfv.datemi >= '2024-01-01'

        -- Para consultar apenas um cliente:
        -- AND cli.codcli = @CodCli
),

PedidosProduto AS (
    SELECT
        CodCli,
        CodPro,
        Produto,
        NumPed,

        MIN(Emissao) AS Emissao,

        SUM(Volume) AS VolumePedido,

        SUM(VlrFat) AS VlrPedido,

        AVG(PrecoUnitario) AS PrecoMedioPedido,

        AVG(Margem) AS MargemMediaPedido

    FROM BaseVendas

    GROUP BY
        CodCli,
        CodPro,
        Produto,
        NumPed
),

ComprasProdutoAnterior AS (
    SELECT
        CodCli,
        CodPro,
        NumPed,
        Emissao,

        LAG(Emissao) OVER (
            PARTITION BY CodCli, CodPro
            ORDER BY Emissao, NumPed
        ) AS CompraAnterior

    FROM PedidosProduto
),

FrequenciaProduto AS (
    SELECT
        CodCli,
        CodPro,

        AVG(
            DATEDIFF(
                DAY,
                CompraAnterior,
                Emissao
            )
        ) AS FrequenciaMediaCompra

    FROM ComprasProdutoAnterior

    WHERE CompraAnterior IS NOT NULL

    GROUP BY
        CodCli,
        CodPro
),

HistoricoProduto AS (
    SELECT
        CodCli,

        CodPro,

        MAX(Produto) AS Produto,

        MIN(Emissao) AS DataPrimeiraCompra,

        MAX(Emissao) AS DataUltimaCompra,

        COUNT(DISTINCT NumPed) AS QuantidadePedidos,

        SUM(VolumePedido) AS VolumeTotal,

        SUM(VlrPedido) AS FaturamentoTotal,

        AVG(MargemMediaPedido) AS MargemPercentual,

        AVG(PrecoMedioPedido) AS PrecoMedio,

        MIN(PrecoMedioPedido) AS PrecoMinimo,

        MAX(PrecoMedioPedido) AS PrecoMaximo

    FROM PedidosProduto

    GROUP BY
        CodCli,
        CodPro
)

SELECT
    h.CodCli,

    h.CodPro,

    h.Produto,

    h.DataPrimeiraCompra,

    h.DataUltimaCompra,

    h.QuantidadePedidos,

    ROUND(h.VolumeTotal, 2) AS VolumeTotal,

    ROUND(h.FaturamentoTotal, 2) AS FaturamentoTotal,

    ROUND(h.MargemPercentual, 2) AS MargemPercentual,

    ROUND(h.PrecoMedio, 2) AS PrecoMedio,

    ROUND(h.PrecoMinimo, 2) AS PrecoMinimo,

    ROUND(h.PrecoMaximo, 2) AS PrecoMaximo,

    ROUND(f.FrequenciaMediaCompra, 2) AS FrequenciaMediaCompra,

    DATEDIFF(
        DAY,
        h.DataUltimaCompra,
        GETDATE()
    ) AS DiasDesdeUltimaCompra

FROM HistoricoProduto h

LEFT JOIN FrequenciaProduto f
    ON f.CodCli = h.CodCli
    AND f.CodPro = h.CodPro

ORDER BY
    h.CodCli,
    h.DataUltimaCompra DESC,
    h.CodPro;