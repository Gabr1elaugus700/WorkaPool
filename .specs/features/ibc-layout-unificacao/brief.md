# Brief — Unificação do layout do módulo IBC

Epic: #360 (relacionada a #31) · Status: **confirmado em 17/10/2026** · Origem: `/impeccable shape`

## 1. Trabalho e público

| Quem | Situação | Trabalho |
| --- | --- | --- |
| ALMOX / ADMIN | Desktop no escritório do almox, rotina diária | Tocar a **viagem** de ponta a ponta (preparar carga, acompanhar, dar entrada, fechar viagem) e manter o **parque de containers** (cadastro, inspeção, checklists) |
| LOGISTICA / GERENTE_DPTO | Desktop, consulta | Conferir o parque e a conciliação com o ERP; acompanhar empréstimos em atraso |
| VENDAS | Desktop, consulta pontual | Ver avisos de containers que ficaram no cliente e empréstimos em atraso da carteira |

Modo da superfície: **Operate**. Escaneabilidade, consistência e hierarquia de ação valem mais do que expressão visual.

## 2. Resultado esperado

- Quem abre o módulo sabe em qual tela fazer cada coisa: **um item de menu por trabalho**, não por entidade técnica.
- Um fluxo (a viagem de uma carga) acontece **dentro de uma superfície**, sem saltar entre rotas soltas.
- Toda tela tem **no máximo uma ação primária visível**; o resto é secundário ou fica num menu.
- Todas as telas compartilham o mesmo cabeçalho, as mesmas abas, a mesma densidade e os mesmos estados de carregando, vazio e erro.

## 3. Direção estrutural

Autoridade visual: o `DESIGN.md` atual (Operations Greenroom). Não é redesign de identidade; é consolidação de estrutura e padrão.

### Mapa: de 6 itens de menu e 10 views para 3 superfícies

| Superfície (menu) | Roles | Abas / etapas | Absorve |
| --- | --- | --- | --- |
| **Expedição IBC** | ALMOX, ADMIN | Abas: Aguardando · Em viagem · Entrada no pátio. Detalhe da carga com etapas: Preparação → Em viagem → Fechar viagem | `ExpedicaoIbcListView`, `ExpedicaoIbcEmViagemView`, `EntradaPatioIbcView`, `ExpedicaoIbcPreparacaoView`, `ConciliacaoViagemView` |
| **Gestão de IBC** | ADMIN, ALMOX, LOGISTICA, GERENTE_DPTO (escrita só ADMIN/ALMOX) | Abas: Containers · Checklists (só escrita) · Conciliação ERP | `CadastroIbcView`, `ChecklistsIbcView`, `ConciliacaoErpView` |
| **Controle IBC** | Avisos: VENDAS, ADMIN · Empréstimos: ADMIN, LOGISTICA, GERENTE_DPTO, VENDAS | Abas: Avisos · Empréstimos em atraso (cada aba aparece só para quem pode ver) | `AvisosRepresentanteView`, `EmprestimosAtrasadosView` |

### Tese por superfície

- **Expedição IBC.** O detalhe da carga vira um **espaço de trabalho único com etapas**. Hoje a preparação usa `?origem=em-viagem` para virar "modo leitura", e o fechamento da viagem fica numa rota irmã. As etapas tornam o estado da carga explícito, e a ação primária muda conforme a etapa (Fechar expedição → Fechar viagem).
- **Gestão de IBC.** O **parque** passa a ser o conteúdo principal, numa tabela densa adequada a desktop. O formulário de Novo IBC (unitário e em lote) sai do topo fixo e vira uma ação primária "Novo IBC" que abre um painel lateral. As seis ações por linha (Inspecionar, Converter, Mudar produto, Checklists, Inspeções, Histórico) viram **uma ação visível** (Inspecionar) mais um **menu de linha**.
- **Controle IBC.** Duas leituras curtas sobre o mesmo fato (container que ficou no cliente), reunidas em abas.

### Padrão comum (fundação)

- `IbcPageHeader`: título, subtítulo, um slot para a ação primária, um slot para ações secundárias e um slot para abas. Substitui os três padrões atuais (`ExpedicaoIbcPageHeader`, ícone com h1 em negrito, h1 simples com seções).
- Abas em rota (`/expedicao-ibc/em-viagem` continua sendo URL): link direto e botão voltar funcionam.
- Um único componente para os estados de carregando, vazio e erro, e um único alerta de acesso negado, com o texto ajustado à role exigida.
- Linha de lista padronizada (`CargaIbcListRow`) no lugar de `CargaExpedicaoListRow` e `CargaEmViagemListRow`.
- Escolhas mutuamente exclusivas (destino e modalidade na conciliação da viagem) viram **controle segmentado**, e não pares de botões primários.
- Remover o `p-4` duplicado do Cadastro e unificar sombras e bordas (`shadow-sm`, borda simples; `border-2` só para estado selecionado).

## 4. Escopo e limites

- Somente front-end: `frontend/src/features/ibc/`, `frontend/src/pages/*Ibc*`, `frontend/src/routes/index.tsx`, `frontend/src/layout/navigation/`.
- **Não muda:** regras de negócio, contratos de API, permissões efetivas, textos de domínio (Carga FECHADA, Entrada no pátio, Fechar expedição, Fechar viagem).
- Rotas antigas (`/cadastro-ibc`, `/checklists-ibc`, `/conciliacao-ibc`, `/avisos-ibc`, `/emprestimos-ibc`, `/expedicao-ibc/:codCar/conciliacao`) **redirecionam** para a nova superfície e aba equivalentes.
- Fora do escopo: epic #356 (momentos do checklist), leitura de QR, backend, mobile como alvo principal.

## 5. Estados e volumes

- Parque de containers: dezenas a centenas de linhas → tabela com filtro de busca por identificador, situação e produto.
- Cargas por aba: poucas a dezenas → lista de linhas.
- Pedidos por carga: 1 a ~10, cada um com N containers vinculados.
- Estados obrigatórios por tela: carregando, vazio (com o próximo passo), erro, sem permissão e somente leitura (LOGISTICA e GERENTE_DPTO na Gestão de IBC).

## 6. Interação e layout

- Hierarquia: cabeçalho → abas → filtros → conteúdo. Ação primária sempre no cabeçalho ou no rodapé da etapa, nunca repetida por card.
- Preparação: o "Vincular" por pedido deixa de ser botão primário e vira um campo com ação secundária; a única ação primária da etapa é Fechar expedição.
- Desktop primeiro; o layout continua utilizável em telas menores, mas sem otimização específica.

## 7. Decisões tomadas

1. Itens de menu: **Expedição IBC**, **Gestão de IBC**, **Controle IBC**.
2. Conciliação ERP é uma aba da Gestão de IBC.
3. O guard de rota da Expedição passa a exigir as mesmas roles do menu (ALMOX, ADMIN), na filha de fundação. Hoje qualquer usuário logado chega na rota e só a view bloqueia; o efeito para o usuário é o mesmo, só muda onde a regra mora.

## 8. Filhas

| Issue | Filha | Depende de |
| --- | --- | --- |
| #361 | Fundação: `IbcPageHeader`, abas em rota, estados e alerta de acesso unificados, guard da Expedição | — |
| #362 | Expedição: abas padronizadas e `CargaIbcListRow` | #361 |
| #363 | Expedição: detalhe da carga com etapas (absorve Conciliação da viagem, remove `?origem`) | #361 |
| #364 | Gestão de IBC: parque em tabela, Novo IBC em painel lateral, menu de linha | #361 |
| #365 | Gestão de IBC: abas Containers · Checklists · Conciliação ERP + redirects | #364 |
| #366 | Controle IBC: Avisos e Empréstimos em abas + redirects | #361 |
| #367 | Menu: de 6 para 3 itens + testes de `navItems` | #362 a #366 |

Variações visuais: depois que cada filha estiver implementada, usar `/impeccable live` na superfície para gerar alternativas de composição no navegador.
