# Coluna de cotações por produto — Context

**Gathered:** 2026-09-21
**Spec:** `.specs/features/overview-customer-group-quote-column/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Na ficha, os chips de grupo continuam. A leitura no Sapiens é uma vez por grupo, na janela de 12 dias, `sitped` 9 e 5, item a item. O backend calcula as datas, guarda o resultado e filtra o cliente aberto e o `codPro`. A coluna mostra carregamento nessa primeira busca. Vendedor não revela outros clientes. Admin e gestor revelam outros clientes do mesmo produto a partir do cache, em tom apagado, com fantasia e badges.

---

## Implementation Decisions

### Consulta

- Origem: `e120ped` + `e120ipd` + representante + cliente + `poolbi.dbo.grppro`.
- População: `ped.sitped IN (9, 5)` e `grp.codgrp = @grpPro`.
- `sitped = 9` é ganha; `sitped = 5` é perdida. A data das duas é `ped.datemi`.
- Janela não usa `GETDATE` nem `DATEADD`. O backend manda `@dataInicio` (hoje menos 12 dias) e `@dataFimExclusiva` (amanhã), em `America/Sao_Paulo`.
- Cliente e `codPro` não entram no SQL.

### Cache e tela

- Cache no backend, chave grupo + início da janela, até mudar o dia em São Paulo.
- Trocar produto, voltar num produto do cliente ou revelar não consulta o Sapiens de novo.
- Falha do Sapiens não é gravada no cache.
- A primeira leitura mostra carregamento, não a mensagem de lista vazia.

### Recorte que a pessoa vê

- Padrão: cliente aberto + produto selecionado, cor cheia, sem badges.
- Revelar: acrescenta outros clientes do mesmo `codPro`, linha apagada, fantasia, badge `Ganha` ou `Perdida`, badge azul `codRep` + nome do usuário (ou `aperep` se não houver usuário).
- O seletor de produto lista só os `codPro` desse cliente dentro da leitura do grupo. O menor código começa selecionado.
- Cada linha mostra os números do item que o SQL traz: quantidade, preço, valor, margem, IPI, ICMS, custo, frete, transportadora e frete incluso.

### Agent's Discretion

- Onde o cache mora no processo, desde que a chave e a validade sejam as da spec.
- Tratamento visual de “apagado”, com badges saturados.
- Layout dos campos extras na linha, sem omitir nenhum deles.

### Declined / Undiscussed Gray Areas → Assumptions

- Motivo da perda continua vindo do order loss no WorkaPool, sem segunda ida ao Sapiens.
- Segundo clique no revelar só oculta o filtro.

---

## Specific References

- SQL alvo do usuário, com a janela trocada por parâmetros.
- Botão: `Revelar cotações de outros vendedores` / `Ocultar cotações de outros vendedores`.
- Cards a tirar do grid: “Ganhos: Notas Faturadas” e “Perdidos: Cotações Sem Fechamento”.

---

## Deferred Ideas

- Página de análise de produto que reutiliza a coluna, fora desta ficha.
