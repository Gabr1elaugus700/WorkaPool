# Overview Customer — Histórico comparativo de cotações (UI)

**Gathered:** 2026-09-23  
**Epic:** [#203](https://github.com/Gabr1elaugus700/WorkaPool/issues/203)  
**Docs issue:** [#209](https://github.com/Gabr1elaugus700/WorkaPool/issues/209)  
**Predecessor:** `.specs/features/overview-customer-group-quote-column/` (#157/#158)  
**Status:** Ready for implementation (T1→T5)

---

## Feature Boundary

Na ficha do cliente, chips ABC (top-5 grupos) já selecionam o grupo. Esta feature substitui a lista de cards de cotações por uma **tabela comparativa** fiel ao mock, usando só o DTO de `/cotacoes`. Sem SQL novo.

Hierarquia:

1. Grupo ABC (já existe)
2. Produto INSUMO (`products[]`)
3. Tabela do produto
4. Reveal + filtros 100% client-side

---

## Closed Decisions

### Reveal — uma carga só

- SQL/cache do grupo já traz todos os `codcli` do `@grpPro`.
- Para `ADMIN` / `GERENTE_DPTO`: primeira carga do produto com `reveal=true`; payload inclui `otherCustomer`.
- Toggle “Outros Vendedores: Visíveis|Ocultos” **não** refetcha e **não** bate no Sapiens de novo.
- `VENDAS`: nunca recebe linhas de outros clientes; sem botão reveal.
- Semântica: outros vendedores = outros **clientes** do **mesmo `codPro`** no grupo.

### Filtros client-side (layout do mock)

| Filtro | Regra |
|--------|--------|
| Todas | rows visíveis após reveal |
| Ganhas | `outcome === "ganha"` && `!otherCustomer` |
| Perdidas | `outcome === "perdida"` && `!otherCustomer` |
| Outros vendedores | `otherCustomer === true` (se reveal oculto → zero / desabilitado) |

Também: busca por `#` / `orderNumber`; dropdown vendedor por `codRep`.

Badges do header (Total / Ganhas / Perdidas / Outros) espelham contagens — **sem** copy “(Você)”.

### Dados — sem inventar

Usar só o DTO atual:

`orderNumber`, `issuedAt`, `outcome`, `situation`, `productCode`, `productName`, `quantity`, `unitPrice`, `lineAmount`, `marginPercent`, `ipiAmount`, `icmsAmount`, `icmsPercent`, `costPrice`, `freightAmount`, `carrierCode`, `freightIncluded`, `codRep`, `sellerName`, `lossReason`, `otherCustomer`, `customerTradeName`, `repShortName`.

Vendedor: sempre nome (`sellerName` → `repShortName` → `codRep`). Nunca badge “Você”.

### Fora de escopo

- Coluna Ações; exportar relatório; NF-e; filial do vendedor
- Mudança de SQL / janela 12 dias / ranking ABC
- OpenAPI de `/cotacoes` (opcional, não bloqueia UI)

---

## UI Targets

Arquivos principais:

- `frontend/src/features/overviewCustomer/components/detail/OverviewCustomerGroupQuotesPanel.tsx`
- `OverviewCustomerGroupQuoteColumn.tsx`
- `OverviewCustomerGroupQuoteProductSelector.tsx`
- `OverviewCustomerGroupQuoteRow.tsx` (evolui para table row)
- `hooks/useOverviewCustomerGroupQuotes.ts`
- `utils/` — filter / summarize / benchmark

Modo Impeccable: **Operate** (DESIGN.md — Operations Greenroom).

---

## Task Index

Ver [tasks.md](./tasks.md).
