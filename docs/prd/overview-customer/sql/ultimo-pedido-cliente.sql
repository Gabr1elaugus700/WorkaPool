WITH BasePedidos AS (
    SELECT
        ped.codcli AS Cliente,
        ped.numped AS Pedido,
        ped.sitped AS Situacao,
        ped.datemi AS Emissao,

        ROW_NUMBER() OVER (
            PARTITION BY ped.codcli
            ORDER BY ped.datemi DESC, ped.numped DESC
        ) AS RN

    FROM e120ped ped

    WHERE ped.datemi >= '2024-01-01'
)

SELECT
    Cliente,
    Pedido,
    Situacao,
    Emissao
FROM BasePedidos
WHERE RN = 1
ORDER BY Cliente