# Customer Overview (PRD)

Visão 360º do cliente no WorkaPool.

## Fontes oficiais

| Artefato | Onde |
|----------|------|
| PRD | [PRD.md](./PRD.md) — espelho de [#92](https://github.com/Gabr1elaugus700/WorkaPool/issues/92) |
| SQL Senior (entrada do sync) | [sql/](./sql/) |
| Tickets (slices) | [#93](https://github.com/Gabr1elaugus700/WorkaPool/issues/93)–[#99](https://github.com/Gabr1elaugus700/WorkaPool/issues/99) |

## SQL versionado

Scripts de análise já validados, copiados para o repo para o worker noturno e para agents/CI **não** dependerem de pastas locais fora do git.

| Arquivo | Uso |
|---------|-----|
| `sql/dados-gerais-cliente.sql` | Identity (ajustar 1ª/última compra às regras de NF faturada do PRD) |
| `sql/resumo-comercial.sql` | Resumo + frequência numérica (margem no sync: ponderada por item — ver PRD) |
| `sql/evolucao-mensal.sql` | Série mensal |
| `sql/produtos-comprados.sql` | Mix de produtos |
| `sql/ultimo-pedido-cliente.sql` | Exploração de último pedido; datas canônicas no produto seguem o PRD (faturado / perdido / movimentação) |

## Ordem de implementação

1. [#93](https://github.com/Gabr1elaugus700/WorkaPool/issues/93) sync + admin  
2. [#94](https://github.com/Gabr1elaugus700/WorkaPool/issues/94) identity + auth  
3. Em paralelo: [#95](https://github.com/Gabr1elaugus700/WorkaPool/issues/95)–[#99](https://github.com/Gabr1elaugus700/WorkaPool/issues/99)
