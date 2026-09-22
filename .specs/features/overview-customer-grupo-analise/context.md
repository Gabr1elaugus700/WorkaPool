# Overview Customer — Análise 5×5 por grupo — Context

**Gathered:** 2026-09-20
**Spec:** `.specs/features/overview-customer-grupo-analise/spec.md`
**Frontend spec:** `.specs/features/overview-customer-grupo-analise-ui/spec.md`
**Status:** Ready for design

---

## Feature Boundary

No Overview do cliente, uma seção com até 5 chips da **curva ABC por grupo de produto**. O chip selecionado filtra, abaixo, dois cards lado a lado: até 5 pedidos **ganhos** e até 5 **perdidos** daquele grupo (agregados por `numped`).

Não é expand de SKU, não é página própria, não é listagem de todos os grupos.

---

## Implementation Decisions

### Grain do TOP 5

- Uma linha = um pedido (`numped`).
- Itens do mesmo pedido **no grupo selecionado** agregam: soma volume (e quantidade), soma valor final; `preuni` e margem derivados do agregado do pedido no grupo.
- Um pedido com itens em dois grupos pode aparecer no TOP 5 de cada grupo, só com os itens daquele grupo.

### Fonte dos ganhos (snapshot, passo novo no sync)

- Ganhos **não** vêm de request ao SQL Server.
- Novo passo no sync noturno do Overview (irmão de `produtos-comprados`), sem substituir o snapshot agregado por SKU.
- O extract atual de produtos já traz linha com `numped`, data, `codpro`, qtd, preço e margem. O passo novo junta `produto_grupo_map`, bucket `OUTROS PRODUTOS` e materializa grain **cliente + grupo + pedido**.
- Filtros comerciais iguais ao Overview: NF `sitnfv = 2`, `venfat = 'S'`, `qtdfat > qtddev`, `numped > 0`, corte `2024-01-01`, regra de volume do `101072`.
- A tela lê Postgres (served snapshot). Freshness = `lastSuccessfulSyncAt`.

### Fonte dos perdidos (Sapiens + orderLoss)

- On-demand no ERP: `sitped = 5`, `CODCLI` + `CODGRP`, `ORDER BY DATEMI DESC`, TOP 5 em grain de pedido (mesmo agregado).
- Sem cutoff de data.
- Motivo: join Postgres `orderLoss` por `Order.orderNumber` = `numped`. Sem match → `Sem justificativa registrada.`
- Vendedor / share fora da v1.

### Chips = ABC por grupo

- Tudo neste slice é por **grupo** (`CODGRP`), não por SKU.
- Chips = top 5 grupos por participação no faturamento (mesma base de ganhos desde jan/2024).
- `OUTROS PRODUTOS` é um bucket (produtos sem mapa); entra no chip se estiver entre os 5.
- Chip selecionado filtra os dois cards. Default: o de maior share.

### Layout

- Faixa de chips no topo (wireframe 2026-09-20).
- Dois cards lado a lado: ganhos (verde) | perdidos (vermelho).
- Fetch da análise no select do chip (lazy). Lista de chips pode vir do snapshot de grupos.
- Ganhos: a UI mostra **`numnfv`**. `numped` fica no contrato para agregar e para qualquer join. Se o mesmo pedido+grupo tiver mais de uma NF, mostra a `numnfv` da emissão mais recente.
- Perdidos: a UI mostra **`numped`** (pedido cancelado/perdido não tem NF).
- Perdidos: GET autenticado no Overview. SQL canônica = query do usuário (2026-09-20) em `sql/perdidos-por-grupo.sql`: sem `BETWEEN`, sem filtro `codpro`; `@codCli` + `@codGrp` (OUTROS = `grp.codgrp IS NULL`). Agrega por `numped`, TOP 5. Colunas de vendedor/cidade não entram na UI v1.

### Falha Sapiens (perdidos)

- Cards **independentes**.
- Ganhos do snapshot continuam visíveis.
- Perdidos: erro distinto + retry. Proibido usar `Nenhum pedido encontrado.` para falha de consulta.

### Agent's Discretion

- Forma exata do DTO/HTTP (um GET com campo de erro em perdidos vs. dois GETs), desde que o outcome dos cards independentes se mantenha.
- Sentinel estável do bucket OUTROS (`OUTROS` + label `OUTROS PRODUTOS`).
- `preuni` no agregado: média ponderada pelo volume do grupo no pedido.

### Declined / Undiscussed Gray Areas → Assumptions

- Rate limit extra: N/A — mesma superfície do Overview.
- Concurrency de clique rápido: resposta atrasada do chip anterior não substitui o chip atual.
- Observabilidade: passo novo no log de sync; falha Sapiens no card não derruba o publish do snapshot.

---

## Specific References

- Wireframe: chips no topo + dois cards (verde | vermelho).
- Copy: `Sem justificativa registrada.` / `Nenhum pedido encontrado.`
- PRD: `docs/prd/overview-customer-grupo-analise/PRD.md` — recortado: filtro por grupo via chips ABC, não expand de grupo; ganhos via novo passo de sync, não live ERP.
- Dependência: `produto_grupo_map` / `GrpProSync` já no repo.

---

## Deferred Ideas

- Sync noturno de perdidos / pivot 5×5 pré-montado.
- Análise em página própria.
- Vendedor e revenue/share na UI v1.
- Substituir a tabela de produtos comprados (SKU) ou a ABC de SKU já existente na tela.
- Consulta Senior ao vivo para ganhos.
