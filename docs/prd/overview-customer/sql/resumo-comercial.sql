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

        rep.codrep AS CodRep,

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

    LEFT JOIN e090rep rep
        ON rep.codrep = ped.codven

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

        -- Para consultar apenas um cliente:
        -- AND cli.codcli = @CodCli
),

PedidosCliente AS (
    SELECT
        CodCli,
        NumPed,

        MIN(Emissao) AS Emissao,

        SUM(VlrFat) AS VlrPedido,

        SUM(Volume) AS VolumePedido,

        AVG(Margem) AS MargemMediaPedido

    FROM BaseVendas

    GROUP BY
        CodCli,
        NumPed
),

ComprasComAnterior AS (
    SELECT
        CodCli,
        NumPed,
        Emissao,

        LAG(Emissao) OVER (
            PARTITION BY CodCli
            ORDER BY Emissao, NumPed
        ) AS CompraAnterior

    FROM PedidosCliente
),

FrequenciaCompra AS (
    SELECT
        CodCli,

        AVG(
            DATEDIFF(
                DAY,
                CompraAnterior,
                Emissao
            )
        ) AS FrequenciaMediaDias

    FROM ComprasComAnterior

    WHERE CompraAnterior IS NOT NULL

    GROUP BY CodCli
),

VendasPorVendedor AS (
    SELECT
        CodCli,
        CodRep,

        COUNT(DISTINCT NumPed) AS QuantidadePedidos,

        MAX(Emissao) AS UltimaVenda

    FROM BaseVendas

    WHERE CodRep IS NOT NULL

    GROUP BY
        CodCli,
        CodRep
),

VendedorPrincipal AS (
    SELECT
        CodCli,
        CodRep,
        QuantidadePedidos,
        UltimaVenda,

        ROW_NUMBER() OVER (
            PARTITION BY CodCli
            ORDER BY
                QuantidadePedidos DESC,
                UltimaVenda DESC
        ) AS Posicao

    FROM VendasPorVendedor
),

MetricasCliente AS (
    SELECT
        CodCli,

        /* FATURAMENTO */

        SUM(VlrPedido) AS FaturamentoTotal,

        SUM(
            CASE
                WHEN Emissao >= DATEADD(MONTH, -12, GETDATE())
                THEN VlrPedido
                ELSE 0
            END
        ) AS FaturamentoUltimos12Meses,

        SUM(
            CASE
                WHEN Emissao >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
                THEN VlrPedido
                ELSE 0
            END
        ) AS FaturamentoAnoAtual,

        SUM(
            CASE
                WHEN Emissao >= DATEFROMPARTS(YEAR(GETDATE()) - 1, 1, 1)
                 AND Emissao < DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
                THEN VlrPedido
                ELSE 0
            END
        ) AS FaturamentoAnoAnterior,


        /* PEDIDOS */

        COUNT(*) AS QuantidadePedidos,

        SUM(
            CASE
                WHEN Emissao >= DATEADD(MONTH, -12, GETDATE())
                THEN 1
                ELSE 0
            END
        ) AS QuantidadePedidosUltimos12Meses,


        /* VOLUME */

        SUM(VolumePedido) AS VolumeTotal,

        SUM(
            CASE
                WHEN Emissao >= DATEADD(MONTH, -12, GETDATE())
                THEN VolumePedido
                ELSE 0
            END
        ) AS VolumeUltimos12Meses,

        AVG(VolumePedido) AS VolumeMedioPorPedido,


        /* TICKET */

        AVG(VlrPedido) AS TicketMedio,

        AVG(
            CASE
                WHEN Emissao >= DATEADD(MONTH, -12, GETDATE())
                THEN VlrPedido
            END
        ) AS TicketMedioUltimos12Meses,


        /* MARGEM */

        AVG(MargemMediaPedido) AS MargemMedia,


        /* DATAS */

        MIN(Emissao) AS DataPrimeiraCompra,

        MAX(Emissao) AS DataUltimaCompra,

        DATEDIFF(
            DAY,
            MAX(Emissao),
            GETDATE()
        ) AS DiasDesdeUltimaCompra

    FROM PedidosCliente

    GROUP BY CodCli
)

SELECT
    m.CodCli,

    /* =========================
       FATURAMENTO
       ========================= */

    ROUND(m.FaturamentoTotal, 2) AS FaturamentoTotal,

    ROUND(m.FaturamentoUltimos12Meses, 2) AS FaturamentoUltimos12Meses,

    ROUND(m.FaturamentoAnoAtual, 2) AS FaturamentoAnoAtual,

    ROUND(m.FaturamentoAnoAnterior, 2) AS FaturamentoAnoAnterior,


    /* =========================
       PEDIDOS
       ========================= */

    m.QuantidadePedidos,

    m.QuantidadePedidosUltimos12Meses,


    /* =========================
       VOLUME
       ========================= */

    ROUND(m.VolumeTotal, 2) AS VolumeTotal,

    ROUND(m.VolumeUltimos12Meses, 2) AS VolumeUltimos12Meses,

    ROUND(m.VolumeMedioPorPedido, 2) AS VolumeMedioPorPedido,


    /* =========================
       TICKET
       ========================= */

    ROUND(m.TicketMedio, 2) AS TicketMedio,

    ROUND(m.TicketMedioUltimos12Meses, 2) AS TicketMedioUltimos12Meses,


    /* =========================
       MARGEM
       ========================= */

    ROUND(m.MargemMedia, 2) AS MargemMedia,


    /* =========================
       DATAS
       ========================= */

    m.DataPrimeiraCompra,

    m.DataUltimaCompra,

    m.DiasDesdeUltimaCompra,


    /* =========================
       FREQUÊNCIA
       ========================= */

    ROUND(f.FrequenciaMediaDias, 2) AS FrequenciaMediaDias,


    /* =========================
       VENDEDOR PRINCIPAL
       ========================= */

    v.CodRep AS CodVendedorPrincipal,

    v.QuantidadePedidos AS PedidosComVendedorPrincipal,

    v.UltimaVenda AS UltimaVendaComVendedorPrincipal

FROM MetricasCliente m

LEFT JOIN FrequenciaCompra f
    ON f.CodCli = m.CodCli

LEFT JOIN VendedorPrincipal v
    ON v.CodCli = m.CodCli
    AND v.Posicao = 1

ORDER BY
    m.CodCli;