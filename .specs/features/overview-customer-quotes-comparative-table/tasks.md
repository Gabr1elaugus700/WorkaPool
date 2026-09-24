# Tasks — Histórico comparativo de cotações (UI)

**Epic:** [#203](https://github.com/Gabr1elaugus700/WorkaPool/issues/203)  
**Context:** [context.md](./context.md)  
**Ordem:** T1 → T2 → T3 → T4 → T5 (uma issue = uma branch = um PR)

---

## T1 — Carga única + reveal local

**Issue:** [#204](https://github.com/Gabr1elaugus700/WorkaPool/issues/204)  
**Branch:** `feature/204-quotes-reveal-single-load`

- [ ] ADMIN/GERENTE: fetch inicial com `reveal=true`; estado `revealVisible` só filtra exibição
- [ ] Toggle reveal não muda query key / não refetch
- [ ] VENDAS: sem reveal; sem botão
- [ ] Testes hook/panel

**Arquivos:** `OverviewCustomerGroupQuotesPanel.tsx`, `useOverviewCustomerGroupQuotes.ts`

---

## T2 — Header, badges, chips INSUMO, botão reveal

**Issue:** [#205](https://github.com/Gabr1elaugus700/WorkaPool/issues/205)  
**Branch:** `feature/205-quotes-comparative-header-chips`

- [ ] Título/descrição alinhados ao mock
- [ ] Badges Total / Ganhas / Perdidas / Outros (sem “(Você)”)
- [ ] Chips INSUMO com estado selecionado
- [ ] Legenda Ganha / Perdida / Outro vendedor
- [ ] Botão “Outros Vendedores (N): Visíveis|Ocultos” (só se role permitir)

**Arquivos:** Column, ProductSelector → chips, summary badges

**Depende de:** T1

---

## T3 — Filtros status / busca / vendedor

**Issue:** [#206](https://github.com/Gabr1elaugus700/WorkaPool/issues/206)  
**Branch:** `feature/206-quotes-comparative-filters`

- [ ] Botões Todas | Ganhas | Perdidas | Outros (regras em context.md)
- [ ] Busca por `orderNumber`
- [ ] Dropdown vendedores por `codRep`
- [ ] Utils puros + testes unitários
- [ ] Layout da toolbar igual ao print

**Arquivos:** `frontend/src/features/overviewCustomer/utils/*`, toolbar component

**Depende de:** T1 (payload completo), combina com T2

---

## T4 — Tabela densa com todos os campos do DTO

**Issue:** [#207](https://github.com/Gabr1elaugus700/WorkaPool/issues/207)  
**Branch:** `feature/207-quotes-comparative-table`

- [ ] Substituir cards por tabela
- [ ] Colunas: ID, Data, Vendedor, Volume, Preço, Valor, Margem, Custo, IPI, ICMS, ICMS %, Frete (+ transportadora / frete incluso se couber), Status & motivo
- [ ] Sem Ações; sem “Você”; sem NF-e/filial inventados
- [ ] Cores de linha ganha / perdida / outro
- [ ] Testes de row/table

**Depende de:** T2 / T3

---

## T5 — Benchmark + testes finais

**Issue:** [#208](https://github.com/Gabr1elaugus700/WorkaPool/issues/208)  
**Branch:** `feature/208-quotes-comparative-benchmark-tests`

- [ ] Barra: preço médio ganha / perdido / spread das rows filtradas
- [ ] Suite cobrindo filtros, reveal sem refetch, contagens, ausência de Ações/“Você”
- [ ] `npm test` (front tocado) + `npx tsc --noEmit --project tsconfig.app.json`
- [ ] Não rodar production build

**Depende de:** T1–T4

---

## Docs (esta pasta)

**Issue:** [#209](https://github.com/Gabr1elaugus700/WorkaPool/issues/209)  
**Branch:** `feature/209-quotes-comparative-table-spec`

- [x] `context.md` + `tasks.md` na main via PR
