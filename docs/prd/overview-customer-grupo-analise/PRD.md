# PRD — Análise 5×5 por grupo (Overview Cliente)

**Produto:** WorkaPool  
**Status:** especificação aprovada (grilling 2026-09-20)  
**Audiência:** implementação (Cursor) / revisão técnica  
**Depende de:** Slice 1 `produto_grupo_map` / `GrpProSync` (PRD grppro)

---

## Problem Statement

No Overview do cliente falta, ao expandir um **grupo de produto**, ver lado a lado os 5 pedidos **ganhos** e os 5 **perdidos** mais recentes — com valor, quantidade, margem e, nos perdidos, a justificativa da perda.

Hoje:
- Ganhos no Overview existem como snapshot agregado por produto (`produtos-comprados`), **sem** `numped`.
- Perdidos existem no ERP (`sitped = 5`) e o motivo vive no Postgres WorkaPool (`orderLoss`), mas não há join na UI do Overview por grupo.

---

## Solution

Entregar a fatia **Análise 5×5 por grupo** no Overview do cliente:

1. **UI:** Overview do cliente → expandir um grupo de produto.
2. **Ganhos:** TOP 5 por data mais recente. **Alteração necessária** no snapshot/materialização Overview `produtos-comprados` (ou extract equivalente) para trazer **`numped`** e campos de linha de pedido — não permanecer só no agregado por produto.
3. **Perdidos:** query **on-demand** no ERP Senior (Sapiens), sem janela/cutoff de data: filtrar `CODCLI` + `CODGRP`, `ORDER BY DATEMI DESC`, `TOP 5`.
4. **Motivo da perda:** após trazer os pedidos do Sapiens, **join** com o banco Postgres do WorkaPool (`orderLoss`): `Order.orderNumber` = `ped.numped` → `LossReason`. Sem match → copy fixo.
5. **Grupo:** filtro canônico por `CODGRP`. Produtos sem mapa entram como **`OUTROS PRODUTOS`**.
6. **Permissão:** igual ao Overview — `ADMIN`, `gerente_dpto`, e `codrep` igual ao do cliente.

---

## Decisions Locked (grilling)

| Tópico | Decisão |
|--------|---------|
| Onde na UI | Overview do cliente, ao expandir o grupo |
| Ganhos — ordenação | `lastPurchaseAt` / data mais recente → TOP 5 |
| Ganhos — grain | **Pedido** (precisa `numped`); alterar snapshot Overview |
| Perdidos — fonte linhas | ERP Senior / Sapiens (`sitped = 5`) |
| Perdidos — motivo | Postgres WorkaPool `orderLoss`, join por nº pedido Sapiens |
| Perdidos — ordenação | `DATEMI` DESC, TOP 5 |
| Perdidos — janela | **Sem cutoff**; só TOP 5 |
| Filtro de grupo | `CODGRP` (não filtrar só por `DESGRP`) |
| Sem mapa | Incluir grupo `OUTROS PRODUTOS` |
| Permissão | `ADMIN`, `gerente_dpto`, `codrep` do cliente |
| Campos linha | `numped`, `datemi`, `vlrfinal`, `qtdped`, `preuni`, `margem`; perdidos + `motivo` |
| Sem vendedor / share na v1 | Fora |

### Copy fixo

| Situação | Mensagem |
|----------|----------|
| Sem motivo no orderLoss | `Sem justificativa registrada.` |
| Top 5 vazio (ganhos ou perdidos) | `Nenhum pedido encontrado.` |

---

## Dual-source (perdidos)

1. **ERP Senior (Sapiens):** dados do pedido/linha (`e120ped`, `e120ipd`, joins de cliente/rep/grppro).
2. **Postgres WorkaPool (`orderLoss`):** justificativa (`LossReason`: FREIGHT, PRICE, MARGIN, STOCK, OTHER + description).

Fluxo: buscar TOP 5 no Sapiens → para cada `numped`, join local `Order.orderNumber` → `LossReason`. Pedido Sapiens sem registro local → `Sem justificativa registrada.`

---

## SQL base — perdidos (Sapiens)

```sql
SELECT TOP 5
    ped.datemi AS [DATA],
    ped.numped AS [NUMPED],
    ped.sitped AS [SITUACAO],
    ped.codven AS [CODREP],
    rep.aperep AS [APEREP],
    ped.codcli AS [CODCLI],
    cli.apecli AS [FANTASIA],
    CONCAT(cli.cidcli, ' - ', cli.sigufs) AS [CIDADE],
    ISNULL(grp.desgrp, 'OUTROS PRODUTOS') AS [PRODUTO],
    ipd.qtdped AS [QTDPED],
    ipd.preuni AS [PREUNI],
    ipd.usu_vlrfin AS [VLRFINAL],
    ipd.usu_mgmluc AS [MARGEM_LUCRO]
FROM e120ped ped
INNER JOIN e120ipd ipd
    ON ipd.codemp = ped.codemp
   AND ipd.codfil = ped.codfil
   AND ipd.numped = ped.numped
INNER JOIN e090rep rep ON rep.codrep = ped.codven
INNER JOIN e085cli cli ON cli.codcli = ped.codcli
LEFT JOIN poolbi.dbo.grppro grp ON grp.codpro = ipd.codpro
WHERE ped.sitped = '5'
  AND ped.codcli = @codCli
  AND grp.codgrp = @codGrp   -- OUTROS: tratar NULL/ausência de mapa conforme regra OUTROS PRODUTOS
ORDER BY ped.datemi DESC;
```

(Parametrizar; não usar datas literais de exemplo.)

---

## API (proposta)

- `GET .../clientes/:codCli/grupos`
- `GET .../clientes/:codCli/grupos/:grupoCodigo/analise` → `{ ganhos: [...], perdidos: [...] }`

Campos por item alinhados à tabela de campos travada.

---

## Fora de escopo

- Sync noturno de perdidos
- Pivot 5×5 pré-montado no sync
- Filtro canônico só por `DESGRP`
- Vendedor e revenue/share na UI v1
- Análise em página própria (fica no Overview)

---

## Delivery slices (sugerido)

1. Alterar Overview `produtos-comprados` / materialização para grain com `numped` (ganhos)
2. Endpoint perdidos Sapiens + join `orderLoss`
3. Endpoint/listagem de grupos do cliente (incl. OUTROS PRODUTOS) — depende `produto_grupo_map`
4. UI expand no Overview (5 ganhos + 5 perdidos)

---

## Acceptance (alto nível)

1. Expandir grupo no Overview mostra até 5 ganhos e 5 perdidos ordenados por data DESC.
2. Ganhos incluem `numped` e campos de linha.
3. Perdidos vêm do Sapiens; motivo do WorkaPool via join por nº pedido; sem motivo → copy fixo.
4. Sem resultados → `Nenhum pedido encontrado.`
5. Permissão igual Overview.
6. `OUTROS PRODUTOS` listável.
