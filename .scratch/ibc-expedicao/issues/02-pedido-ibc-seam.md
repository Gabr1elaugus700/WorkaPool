## Parent

https://github.com/Gabr1elaugus700/WorkaPool/issues/36

## What to build

Pedidos on a Carga expose IBC eligibility and expected container counts from real Sapiens fields on `QUERY_GET_PEDIDOS_BY_CARGA`:

- `CODIGO_EMBALAGEM` (`der.usu_codemb`) = **251001** → container line
- `VOLUME_EMBALAGEM` (`der.usu_qtdmve`) — divisor
- `QUANTIDADE_PEDIDO` (`ipd.qtdped`) — numerator
- `INCLUSO` (`ipd.usu_embinc`) — only interpreted on 251001 lines

**Quantidade esperada de IBC** is computed in the **backend only** (not in SQL), only for container lines: per line `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM`, then sum. Expose split:

```ts
{
  isContainer: boolean
  quantidadeEsperadaTotal: number
  quantidadeEsperadaVenda: number      // INCLUSO normalizes to "S"
  quantidadeEsperadaEmprestimo: number // otherwise (null/empty/N/junk → N)
}
```

Downstream expedition uses **total** for AlocacaoIbc / Fechar expedição. Venda/Empréstimo split is informational in this slice.

End-to-end: extend pedidos-by-carga query → mapper/DTO → unit tests with mocked Sapiens rows (no full SQL integration). Do **not** enrich BASE / by-rep queries in this ticket.

## Acceptance criteria

- [ ] `QUERY_GET_PEDIDOS_BY_CARGA` returns CODIGO_EMBALAGEM, VOLUME_EMBALAGEM, QUANTIDADE_PEDIDO (or existing QUANTIDADE), INCLUSO per line
- [ ] Pedido with valid 251001 lines is flagged `isContainer` with correct total = sum of per-line divisions
- [ ] Pedido without 251001 lines is not IBC-eligible
- [ ] Multiple container lines sum correctly; Venda vs Empréstimo counts are exposed separately when both exist
- [ ] VOLUME_EMBALAGEM ≤ 0 or non-integer division → Pedido IBC inválido (blocked for that Pedido) + signal for ALMOX alert; other Pedidos on the Carga unaffected
- [ ] INCLUSO: trim/upper; only `"S"` is Venda; any other value counts as Empréstimo
- [ ] Calculation runs only for CODIGO_EMBALAGEM = 251001 (not for every Pedido line)
- [ ] Tests mock the four ERP fields at repository boundary — term QUANTIDADE_EMBALAGEM must not appear in new code

## Blocked by

- https://github.com/Gabr1elaugus700/WorkaPool/issues/34 (Sapiens discovery — implementation may follow discovery; tests use mock until then)

## Notes (grill ago/2026)

Replaces earlier model `SUM(QUANTIDADE_EMBALAGEM)`. See `.specs/features/ibc/context.md` and `UBIQUITOUS_LANGUAGE.md`.
