# Grupos de produto — sync + cadastro (PRD)

Replicação do mapa `poolbi.dbo.grppro` (SQL Server → Postgres), cadastro de vínculos produto↔grupo pelo WorkaPool, e painel operacional de sync.

## Fontes oficiais

| Artefato | Onde |
|----------|------|
| PRD | [PRD.md](./PRD.md) |
| Contrato técnico (input original) | `~/Downloads/contrato-grppro-sync-e-analise.md` |
| Design system | [DESIGN.md](../../../DESIGN.md) (raiz do repo) |
| Referência visual sync admin | `frontend/src/features/overviewCustomer/views/OverviewSyncAdminView.tsx` |

## Fora deste PRD (fase futura)

- Análise 5+5 por grupo na tela do cliente (`GET .../grupos/:grupoCodigo/analise-pedidos`)
- Cadastro de grupo novo (`modo: novo_grupo`) — grupos nascem no ERP
- Atualização de `DESGRP` / desvínculo (delete)

## Ordem de implementação (slices)

1. **Mirror + sync core** — migration (`produto_grupo_map` + staging) + pipeline (staging + swap atômico) + scheduler (`0 3 * * *`); medir colunas ERP no Slice 1
2. **Sync admin API + sub-aba** — `/api/grppro/sync/*` + aba em `/overview/sync`
3. **Cadastro backend** — listar / validar / POST 9.8 + sync sob demanda (**GRP-API-07**)
4. **Cadastro frontend** — `/grupos-produto/cadastro` + modal + navbar (**GRP-UI-08**)
