# Paleta de vínculo de containers — mockup da Preparação

## Problem Statement

Na Preparação da carga, a paleta de containers já vincula e desvincula, mas o visual não é o do mockup. O chip disponível sai opaco, com o código numa tarja interna; o cabeçalho do grupo não mostra o nome do produto nem "N disponíveis"; não homologado vira uma seção à parte com parágrafo; no teto os disponíveis continuam na tela, desabilitados, com a frase "A quantidade esperada da carga já está vinculada." O mockup é a referência: pílula cheia na cor da placa, Universal com chip tracejado, e, com a quantidade completa, faixa verde e a paleta recolhida.

## Goals

- [ ] A paleta aberta (0/esperado) reproduz o mockup: cabeçalho do grupo, chips, Universal e o botão "Buscar mais containers".
- [ ] Com a quantidade completa e a expedição aberta, a tela mostra a faixa verde, esconde disponíveis e busca, e o toque no vinculado desvincula.
- [ ] O nome do grupo no cabeçalho vem do catálogo (`grupoDescricao`), sem texto inventado.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Cabeçalho da página, passos (Preparação / Em viagem / Fechar viagem), Voltar e Fechar expedição | Já coincidem com o mockup; não são o bloco de vínculo |
| Alertas de pedido misto, grupo sem placa e pedido inválido | Continuam acima do card, como hoje |
| Layout interno do diálogo de busca (filtro e código livre) | O diálogo não está no mockup; só os chips de lá acompanham o chip novo |
| Contrato de alocar e desalocar | O toque continua nas ações que já existem |
| Cores do contador no card da lista (`CargaIbcCard`) | O `PedidoIbcProgress` de lá não muda |
| Nova tela ou modal de troca | Trocar é desvincular o chip e escolher outro quando a paleta volta |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Referência visual | As três imagens do mockup substituem, neste bloco, as linhas da #439 sobre chip opaco, seção "Não homologados" e teto com disponíveis desabilitados | A #439 foi fechada sem mock; o pedido agora é fidelidade à imagem | y |
| Nome no cabeçalho | `grupos[].grupoDescricao` no GET de containers, lido de `produto_grupo_map.grupo_descricao`; null omite o nome | O payload hoje só tem `grupoCodigo`, `sigla` e `corHex`; "Hipoclorito" não pode ser inventado no front | y |
| NH de um grupo | Entra na seção desse grupo, com o chip tracejado e o selo "Não homologado" | O mockup não tem terceira seção; o selo no chip carrega o significado | y |
| Órfão sem grupo e não universal | Seção "Não homologados" só quando existir algum, sem o parágrafo "Prefixo NH: ainda sem homologação de produto." | Não pode sumir da paleta; o mockup não desenha esse caso | y |
| Contagem "N disponíveis" | Total da seção, não o recorte de 8 chips | "8 disponíveis" no mockup é a quantidade que dá para vincular; o card segue mostrando no máximo 8 | y |
| Swatch Universal | Quadrado cinza neutro (`bg-muted`), não a cor da placa universal | O mockup usa cinza; os chips universais não são preenchidos com placa | y |
| Trocar | Clique no vinculado chama a desvinculação já existente | A frase do mockup descreve esse gesto; não há segundo fluxo | y |
| Cópia no teto com esperado > 1 | "Toque em um container vinculado para trocá-lo." | O mockup é o caso 1/1, no singular | y |
| Contador na Preparação | 0 = texto muted; parcial e completo = foreground. A barra parcial continua verde proporcional | O 1/1 do mockup é texto escuro, não esmeralda; a lista de cargas não entra | y |
| Expedição fechada | Mantém "Expedição fechada. Os vínculos são só consulta." e chip estático; não mostra a faixa de troca | O mockup não cobre consulta; o operador não pode trocar | y |
| Botão verde | Hover/foco do mesmo botão tracejado, não uma segunda tela | A segunda imagem é o mesmo controle com borda, fundo e texto na cor primária | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Paleta aberta igual ao mockup ⭐ MVP

**User Story**: As a operador de expedição na Preparação, I want ver os containers disponíveis como no mockup so that eu reconheça a placa, o produto e o que ainda não está homologado sem ler um parágrafo à parte.

**Why P1**: É o estado em que o vínculo acontece. Sem ele, o restante do mockup não tem onde aparecer.

**Acceptance Criteria**:

1. WHEN a homologated available container is shown THEN the chip SHALL be a full-opacity pill filled with `corHex`, with the identifier as plain text, without an inner badge and without the class `opacity-50`.
2. WHEN a linked container is shown THEN the chip SHALL render a check icon before the identifier and an accessible name that contains "Vinculado".
3. WHEN a container with `homologado` false is shown THEN the chip SHALL use a dashed border, no plate fill, and the visible text "Não homologado".
4. WHEN a product group has available containers and `grupoDescricao` is present THEN the section header SHALL show the plate swatch, "{grupoCodigo} · {sigla} {grupoDescricao}", and "{n} disponível" when n is 1 or "{n} disponíveis" otherwise, where n is the total in that section.
5. IF `grupoDescricao` is null THEN the group header SHALL show "{grupoCodigo} · {sigla}" and the count, and SHALL omit any product name.
6. WHEN the Universal section has containers THEN the header SHALL show a neutral gray swatch, the text "Universal", and the same count pattern, and SHALL NOT render "Prefixo NH: ainda sem homologação de produto."
7. IF a non-homologated container has `grupoCodigo` THEN the paleta SHALL place it in that group section with the dashed chip, and SHALL NOT open a "Não homologados" section for it.
8. WHILE the allocated quantity is below the expected quantity and the expedition is open, the screen SHALL show "Buscar mais containers" as a full-width dashed button with a search icon.
9. WHEN that button is hovered or focused THEN the button SHALL use the primary color on its border, its background and its label.
10. WHEN a section has more than 8 available containers THEN the card SHALL render 8 chips and the header count SHALL remain the full total.

**Independent Test**: Paleta com grupo G020 / sigla H / descrição Hipoclorito (8 HM amarelos), 2 universais NH e um NH do grupo G020. O cabeçalho lê "G020 · H Hipoclorito" e "9 disponíveis"; o NH do grupo é tracejado dentro de G020; Universal lê "2 disponíveis"; não existe a frase do prefixo NH.

---

### P1: Quantidade completa recolhe a paleta

**User Story**: As a operador, I want the screen to tell me the load is complete and let me tap the linked container to swap it so that I do not hunt through disabled chips.

**Why P1**: É a segunda imagem de estado do mockup e muda o comportamento do teto que a #441 especificou.

**Acceptance Criteria**:

1. WHILE `quantidadeAlocada` >= `quantidadeEsperadaTotal`, `quantidadeEsperadaTotal` is 1 and the expedition is open, the screen SHALL show the text "A quantidade esperada da carga está completa. Toque no container vinculado para trocá-lo."
2. WHILE `quantidadeAlocada` >= `quantidadeEsperadaTotal`, `quantidadeEsperadaTotal` is greater than 1 and the expedition is open, the screen SHALL show the text "A quantidade esperada da carga está completa. Toque em um container vinculado para trocá-lo."
3. WHILE that complete state holds, the screen SHALL hide the available sections and the "Buscar mais containers" button, and SHALL NOT render "A quantidade esperada da carga já está vinculada."
4. WHEN the user activates a linked container in that complete state THEN the screen SHALL invoke the existing deallocate action for that `alocacaoId`.
5. WHILE the expedition is closed, the screen SHALL show "Expedição fechada. Os vínculos são só consulta.", SHALL NOT show the swap sentence, and SHALL render each linked container as text rather than a button.
6. WHILE `quantidadeEsperadaTotal` is 0, the screen SHALL show "Não há quantidade esperada para vincular nesta carga." and SHALL NOT show the complete-state sentence.
7. IF the palette request fails THEN the screen SHALL show the error and "Tentar de novo", and SHALL NOT show "Buscar mais containers".

**Independent Test**: Carga 1/1 com expedição aberta mostra a faixa verde, o chip HMH00001 com o check antes do código, e não mostra grupos nem o botão de busca. O clique nesse chip dispara a desvinculação.

---

### P1: Barra, contador e nome do grupo

**User Story**: As a operador, I want the progress and the product name to match the mockup so that 0/1 reads as empty and 1/1 reads as done, with the product written next to the plate.

**Why P1**: Sem o campo de descrição o cabeçalho do mockup não fecha; a barra é o sinal de completo ao lado da faixa.

**Acceptance Criteria**:

1. WHILE `quantidadeAlocada` is 0, the preparation progress fill SHALL be 0% wide and the counter SHALL show "0/{quantidadeEsperadaTotal}".
2. WHILE `quantidadeAlocada` >= `quantidadeEsperadaTotal` and `quantidadeEsperadaTotal` > 0, the preparation progress fill SHALL be 100% wide in the primary green.
3. WHILE `quantidadeAlocada` is 0, the preparation counter SHALL use the muted text color.
4. WHILE `quantidadeAlocada` > 0, the preparation counter SHALL use the foreground text color, on this screen only.
5. The `grupos` item of GET `/api/ibc/cargas-expedicao/:codCar/containers` SHALL include `grupoDescricao` as string or null, taken from `produto_grupo_map.grupo_descricao` for that `grupoCodigo`.
6. The list card `CargaIbcCard` SHALL keep the current emerald and amber counter colors.

**Independent Test**: GET da paleta de um grupo cujo catálogo tem "Hipoclorito" devolve `grupoDescricao: "Hipoclorito"`. Na Preparação, 0/1 deixa a barra vazia e o contador muted; 1/1 preenche a barra em verde e o contador em foreground. O card da lista não muda de cor.

---

## Edge Cases

- IF a non-homologated container has no `grupoCodigo` and is not universal THEN the paleta SHALL list it under "Não homologados" with the dashed chip and without the sentence "Prefixo NH: ainda sem homologação de produto."
- WHEN the search dialog is open below the ceiling THEN each chip in the dialog SHALL follow the same pill rules as the card (solid plate, or dashed with "Não homologado").
- WHILE the palette is loading, the screen SHALL show "Carregando containers…" and SHALL NOT show "Buscar mais containers".
- The empty linked row SHALL keep the text "Nenhum container vinculado."

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| VINCP-01 | P1: Paleta aberta | - | Pending |
| VINCP-02 | P1: Paleta aberta | - | Pending |
| VINCP-03 | P1: Paleta aberta | - | Pending |
| VINCP-04 | P1: Paleta aberta | - | Pending |
| VINCP-05 | P1: Paleta aberta | - | Pending |
| VINCP-06 | P1: Paleta aberta | - | Pending |
| VINCP-07 | P1: Paleta aberta | - | Pending |
| VINCP-08 | P1: Paleta aberta | - | Pending |
| VINCP-09 | P1: Paleta aberta | - | Pending |
| VINCP-10 | P1: Paleta aberta | - | Pending |
| VINCP-11 | P1: Quantidade completa | - | Pending |
| VINCP-12 | P1: Quantidade completa | - | Pending |
| VINCP-13 | P1: Quantidade completa | - | Pending |
| VINCP-14 | P1: Quantidade completa | - | Pending |
| VINCP-15 | P1: Quantidade completa | - | Pending |
| VINCP-16 | P1: Quantidade completa | - | Pending |
| VINCP-17 | P1: Quantidade completa | - | Pending |
| VINCP-18 | P1: Barra e nome | - | Pending |
| VINCP-19 | P1: Barra e nome | - | Pending |
| VINCP-20 | P1: Barra e nome | - | Pending |
| VINCP-21 | P1: Barra e nome | - | Pending |
| VINCP-22 | P1: Barra e nome | - | Pending |
| VINCP-23 | P1: Barra e nome | - | Pending |

**Coverage:** 23 total, 0 mapped to tasks (Tasks skipped — one screen, design inline), 23 pending.

---

## Success Criteria

- [ ] Com 0/1, a paleta lê como o primeiro mockup: pílula cheia, "G020 · H Hipoclorito", "N disponíveis", Universal tracejado, botão tracejado em largura total.
- [ ] Com 1/1 e expedição aberta, a paleta lê como o terceiro mockup: barra verde, faixa de troca, só o chip vinculado, sem disponíveis e sem busca.
- [ ] Hover do botão de busca usa a cor primária, como na segunda imagem.
- [ ] Testes de markup da Preparação, do chip, da seção e do agrupamento cobrem teto, chip tracejado e `grupoDescricao`.
