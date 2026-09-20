# Análise 5×5 por grupo (PRD)

Fatia do Overview do cliente: ao expandir um **grupo de produto**, ver lado a lado os 5 pedidos **ganhos** e os 5 **perdidos** mais recentes.

## Fontes oficiais

| Artefato | Onde |
|----------|------|
| PRD | [PRD.md](./PRD.md) |
| Overview Cliente (contexto) | [../overview-customer/](../overview-customer/) |
| Grupos de produto — Slice 1 (`produto_grupo_map` / `GrpProSync`) | [../grppro-sync-cadastro/](../grppro-sync-cadastro/) |

**Depende de:** Slice 1 do PRD grppro (`produto_grupo_map` / `GrpProSync`) e do Overview do cliente (UI + permissão + snapshot `produtos-comprados`).

## Fora de escopo

- Sync noturno de perdidos
- Pivot 5×5 pré-montado no sync
- Filtro canônico só por `DESGRP`
- Vendedor e revenue/share na UI v1
- Análise em página própria (fica no Overview)

## Ordem de implementação (slices)

1. Alterar Overview `produtos-comprados` / materialização para grain com `numped` (ganhos)
2. Endpoint perdidos Sapiens + join `orderLoss`
3. Endpoint/listagem de grupos do cliente (incl. OUTROS PRODUTOS) — depende `produto_grupo_map`
4. UI expand no Overview (5 ganhos + 5 perdidos)
