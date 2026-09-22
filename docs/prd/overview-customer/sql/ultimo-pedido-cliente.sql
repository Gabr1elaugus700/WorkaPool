-- Overview #99: recent invoiced/lost orders + movement dates
-- Sync step: ultimo-pedido-cliente
-- Lost semantics: sitped = 5 (aligned with Order Loss Sapiens)

DECLARE @cutoffDate DATE = '2024-01-01';

-- Invoiced orders (NF faturada, venfat = S) — line-level extract; dedupe by order in materializer
SELECT
    nfv.codcli AS customerCode,
    ipd.numped AS orderNumber,
    CONVERT(VARCHAR(10), nfv.datemi, 23) AS invoiceDate,
    ped.codven AS codRep,
    ipv.codfil AS branchCode
FROM e140ipv ipv
INNER JOIN e140nfv nfv
    ON nfv.numnfv = ipv.numnfv
    AND nfv.codemp = ipv.codemp
    AND nfv.codfil = ipv.codfil
    AND nfv.codsnf = ipv.codsnf
INNER JOIN e120ipd ipd
    ON ipd.codemp = ipv.codemp
    AND ipd.codfil = ipv.codfil
    AND ipd.numped = ipv.numped
    AND ipd.seqipd = ipv.seqipd
INNER JOIN e120ped ped
    ON ped.codemp = ipd.codemp
    AND ped.codfil = ipd.codfil
    AND ped.numped = ipd.numped
INNER JOIN e001tns tns
    ON tns.codemp = ipv.codemp
    AND tns.codtns = ipv.tnspro
WHERE
    ped.numped > 0
    AND nfv.sitnfv = 2
    AND tns.venfat = 'S'
    AND ipv.qtdfat > ipv.qtddev
    AND nfv.datemi >= @cutoffDate
    AND nfv.codcli IS NOT NULL;

-- Lost orders — all sitped at extract; materializer keeps only sitped = 5
SELECT
    ped.codcli AS customerCode,
    ped.numped AS orderNumber,
    CONVERT(VARCHAR(10), ped.datemi, 23) AS issueDate,
    ped.sitped AS sitped,
    ped.codven AS codRep
FROM e120ped ped
WHERE
    ped.datemi >= @cutoffDate
    AND ped.numped > 0
    AND ped.codcli IS NOT NULL;

-- Materializer output (per customer, not returned by SQL):
--   lastInvoicedPurchaseAt, lastLostOrderAt, lastCommercialMovementAt
--   invoicedCountLast12Months, lostCountLast12Months
--   recentInvoicedOrders[] (max 5), recentLostOrders[] (max 5, sitped = 5)
