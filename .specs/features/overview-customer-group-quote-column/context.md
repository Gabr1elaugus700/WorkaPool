# Coluna de cotações por grupo — Context

**Gathered:** 2026-09-21
**Spec:** `.specs/features/overview-customer-group-quote-column/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Na ficha do cliente, a seção “Análise comercial por grupo” continua com os chips de grupo ABC. No lugar dos dois cards, uma coluna lista cada item daquele grupo nas últimas 14 dias, de todos os clientes, ordenada pela data de emissão. Verde é nota faturada; vermelho é cotação sem fechamento. Vendedor vê só os próprios pedidos. Gestor e admin veem também os outros, em tom apagado, com badge de resultado e badge azul do vendedor. A página futura de análise de produto fica de fora; o componente da coluna não depende da ficha.

---

## Implementation Decisions

### Entrada

- O filtro visual é o chip de grupo de produto que já existe.
- Não há busca por código de produto nesta seção.
- A lista não é filtrada pelo cliente aberto. O cliente só autoriza a ficha e define quais grupos aparecem nos chips.

### Grão da linha

- Uma linha é um item do grupo dentro de um pedido.
- Itens do mesmo pedido não são somados. O mesmo número de pedido pode aparecer mais de uma vez.
- O título da linha é só o número do pedido.
- Valor, quantidade, preço unitário e margem são os daquele item.
- Nota fiscal, código do produto e nome do cliente não aparecem na linha.

### Verde, vermelho e outros vendedores

- Verde: nota faturada. Vermelho: `sitped = 5`.
- Os dois resultados entram na mesma coluna, ordenados pela data de emissão.
- Pedido do próprio vendedor: cor cheia, sem badges.
- Pedido de outro vendedor: linha apagada; badge verde `Ganha` ou vermelho `Perdida`; badge azul com `codRep` vindo do SQL e nome vindo de `User.name` no WorkaPool.
- Sem nome de usuário, o badge azul mostra só o `codRep`.

### Agent's Discretion

- Tratamento visual exato de “apagado” (borda, fundo, texto), desde que a linha própria continue verde ou vermelha saturada e os badges do outro vendedor continuem verde, vermelho e azul saturados.
- Se a leitura de usuários falhar, a lista de cotações segue e o badge azul fica só com o `codRep`.
- Empate de vários usuários no mesmo `codRep`: nome não vazio em ordem alfabética, depois menor id.
- `ownedByViewer` falso quando o usuário logado tem `codRep` 0.
- Falha do Sapiens derruba a coluna inteira, com retry, sem lista parcial e sem voltar ao recorte salvo.

### Declined / Undiscussed Gray Areas → Assumptions

- Janela, universo da empresa, corte de papel no servidor, motivo da perda e números do item estão na tabela de assumptions da spec.
- Participação de receita do grupo não entra na coluna.

---

## Specific References

- Cards atuais: “Ganhos: Notas Faturadas” e “Perdidos: Cotações Sem Fechamento”, em `OverviewCustomerGroupAnalysisCards`.
- Verde e vermelho saturados seguem o padrão desses cards para o pedido próprio.
- Badge azul é específico de pedido de outro vendedor, ao lado do badge de resultado.

---

## Deferred Ideas

- Página de análise de produto que reutiliza a coluna, fora desta ficha.
