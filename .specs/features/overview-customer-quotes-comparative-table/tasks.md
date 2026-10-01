# Tasks — Histórico comparativo de cotações (UI)

**Epic:** [#203](https://github.com/Gabr1elaugus700/WorkaPool/issues/203)  
**Context:** [context.md](./context.md)  
**Ordem:** T1 → T2 → T3 → T4 → T5 (uma issue = uma branch = um PR)

---

## T1 — Carga única + reveal local

**Issue:** [#204](https://github.com/Gabr1elaugus700/WorkaPool/issues/204)  
**Branch:** `feature/204-quotes-reveal-single-load`

- [x] ADMIN/GERENTE: fetch inicial com `reveal=true`; estado `revealVisible` só filtra exibição
- [x] Toggle reveal não muda query key / não refetch
- [x] VENDAS: sem reveal; sem botão
- [x] Testes hook/panel

**Arquivos:** `OverviewCustomerGroupQuotesPanel.tsx`, `useOverviewCustomerGroupQuotes.ts`

---

## T2 — Header, badges, chips INSUMO, botão reveal

**Issue:** [#205](https://github.com/Gabr1elaugus700/WorkaPool/issues/205)  
**Branch:** `feature/205-quotes-comparative-header-chips`

- [x] Título/descrição alinhados ao mock
- [x] Badges Total / Ganhas / Perdidas / Outros (sem “(Você)”)
- [x] Chips INSUMO com estado selecionado
- [x] Legenda Ganha / Perdida / Outro vendedor
- [x] Botão “Outros Vendedores (N): Visíveis|Ocultos” (só se role permitir)

**Arquivos:** Column, ProductSelector → chips, summary badges

**Depende de:** T1

---

## T3 — Filtros status / busca / vendedor

**Issue:** [#206](https://github.com/Gabr1elaugus700/WorkaPool/issues/206)  
**Branch:** `feature/206-quotes-comparative-filters`

- [x] Select de status Todos | Ganhas | Perdidas | Outros vendedores, com contagens (regras em context.md)
- [x] Busca por `orderNumber`
- [x] Dropdown vendedores por `codRep`
- [x] Utils puros + testes unitários
- [x] Layout da toolbar igual ao print (busca, vendedor, status)

**Arquivos:** `frontend/src/features/overviewCustomer/utils/*`, toolbar component

**Depende de:** T1 (payload completo), combina com T2

---

## T4 — Tabela densa com todos os campos do DTO

**Issue:** [#207](https://github.com/Gabr1elaugus700/WorkaPool/issues/207)  
**Branch:** `feature/207-tabela-densa-cotacoes`

- [x] Substituir cards por tabela
- [x] Colunas: ID, Data, Vendedor, Volume, Preço, Valor, Margem, Custo, IPI, ICMS, ICMS %, Frete (+ transportadora / frete incluso se couber), Status & motivo
- [x] Sem Ações; sem “Você”; sem NF-e/filial inventados
- [x] Cores de linha ganha / perdida / outro
- [x] Testes de row/table

**Depende de:** T2 / T3

---

## T5 — Benchmark + testes finais

**Issue:** [#208](https://github.com/Gabr1elaugus700/WorkaPool/issues/208)  
**Branch:** `feature/208-quotes-comparative-benchmark-tests`

- [x] Barra: preço médio ganha / perdido / spread das rows filtradas
- [x] Suite cobrindo filtros, reveal sem refetch, contagens, ausência de Ações/“Você”
- [x] `npm test` (front tocado) + `npx tsc --noEmit --project tsconfig.app.json`
- [x] Não rodar production build

**Depende de:** T1–T4

---

## Docs (esta pasta)

**Issue:** [#209](https://github.com/Gabr1elaugus700/WorkaPool/issues/209)  
**Branch:** `feature/209-quotes-comparative-table-spec`

- [x] `context.md` + `tasks.md` na main via PR
