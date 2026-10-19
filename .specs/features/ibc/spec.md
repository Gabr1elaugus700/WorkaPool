# IBC — Especificação (PRD)

**Status**: Approved  
**Tracker**: [Epic #31](https://github.com/Gabr1elaugus700/WorkaPool/issues/31) · Milestone **IBC MVP**

## Problem Statement

A empresa opera com containers IBC (empréstimo, venda, troca, transbordo) sem identidade rastreável. Hoje não dá para responder com confiança: qual IBC está com qual Cliente, quando deveria voltar, se está apto, se a data limite de uso venceu, ou se uma troca substituiu qual ativo. Controle só por “quantidade em estoque” não resolve custódia, qualidade nem inadimplência de devolução.

## Goals

- [ ] Cada IBC do pool tem identidade (número + QR) e histórico de custódia/modalidade/inspeção
- [ ] Operação sabe **IBC X está no Cliente Y** pelo pedido apontado na volta, não pelo plano da saída
- [ ] Empréstimos têm prazo (**90 dias** a partir do Fechar Viagem) e o Representante é avisado só nesse caso; incluso não gera aviso
- [ ] IBC Inapto (inspeção ou data limite) aparece em alerta no módulo e não entra em nova viagem
- [ ] Troca, Transbordo, Empréstimo e Venda são distinguíveis no modelo e no fluxo operacional

## Out of Scope

| Item | Motivo |
| ---- | ------ |
| Validade / shelf life do produto químico | Foco é o **container**; fora deste módulo |
| Cálculo de frete / roteirização | Descontinuado / outro contexto |
| App nativo do motorista | Web app WorkaPool (mobile browser) na v1 |
| Pareamento automático de Troca sem operador | Operador classifica e vincula 1:1 |
| Notificação push/email externa | v1 = aviso **in-app** no WorkaPool |
| Etiquetagem física em massa (impressão Zebra etc.) | Processo operacional; sistema só gera identificador/QR |

---

## Actors

| Papel | Responsabilidade no módulo |
| ----- | -------------------------- |
| ALMOX (pátio) | Cadastro IBC, Preparação de expedição (`AlocacaoIbc` na carga, sem pedido), Fechar expedição (`ExpedicaoIbc`), na volta aponta o pedido, Entrada no pátio, Troca 1:1, Inspeção/Aptidão |
| Logística | Fechar Carga com `CargaDespacho` (motorista + caminhão); cadastro de caminhões em [Frota](../frota/spec.md) |
| Motorista | Marca no papel, em cada bloco de pedido, o que ficou e o que foi troca. Não escolhe pedido no sistema |
| Representante (vendedor) | Recebe Aviso só quando IBC de empréstimo do Pedido ficou no Cliente |
| Admin | Visão ampla, alertas, configuração de acesso |

---

## User Stories

### P1: Cadastro e identidade do IBC ⭐ MVP

**User Story**: Como operador de pátio, quero cadastrar cada IBC com identificador, QR, Aquisição (compra/troca) e Data limite de uso, para que o ativo exista no sistema.

**Why P1**: Sem identidade não há o restante do fluxo.

**Acceptance Criteria**:

1. WHEN o operador cadastra um IBC THEN o sistema SHALL gerar/registrar identificador único e dados de QR consultáveis
2. WHEN o cadastro informa Aquisição THEN o sistema SHALL persistir `compra` ou `troca`
3. WHEN o IBC é cadastrado THEN o sistema SHALL colocá-lo em **Aguardando inspeção** (Inapto) até a primeira Inspeção
4. WHEN a Data limite de uso é atingida/ultrapassada THEN o sistema SHALL marcar **Inapto por data limite** e exibir alerta com o identificador

**Independent Test**: Cadastrar IBC #H001 → aparece Inapto/aguardando inspeção → alerta listável.

---

### P1: Inspeção e Aptidão ⭐ MVP

**User Story**: Como operador, quero inspecionar o IBC com score 0–10 por fator do checklist e liberar ou manter Inapto, para que só recipientes verificados voltem a circular.

**Why P1**: Política: toda entrada e todo cadastro exigem verificação.

**Acceptance Criteria**:

1. WHEN o operador abre a tela de aptidão THEN o sistema SHALL exigir scores por fator (coloração, registro, bolsa, pés/base, tampa, grade) com histórico
2. WHEN fatores críticos (registro, bolsa, pés/base) ficam abaixo do piso OR a média dos demais falha a regra THEN o sistema SHALL resultar **Inapto**
3. WHEN a Inspeção passa na regra híbrida THEN o sistema SHALL marcar **Apto**
4. WHEN existem IBCs Inapto THEN o módulo SHALL listar alertas com identificador + motivo (inspeção / data limite / aguardando inspeção)
5. WHEN um IBC está Inapto THEN o sistema SHALL **bloquear** Alocação na Carga desse IBC

**Independent Test**: Inspecionar #H001 com registro baixo → Inapto + alerta; corrigir em nova inspeção → Apto e elegível à carga.

---

### P1: Expedição — Preparação e Em viagem ⭐ MVP

**User Story**: Como operador ALMOX, quero preparar a expedição vinculando os IBCs à Carga, sem escolher pedido, e fechar a expedição quando a quantidade vinculada for o total dos pedidos elegíveis, para que os containers Aptos saiam do pátio (**Em viagem**) ainda sem pedido.

**Why P1**: Início do ciclo de custódia da viagem. O pedido só nasce na volta. Depende de cadastro + aptidão (#32, #35) e fechamento de carga com despacho (#33).

**Acceptance Criteria**:

1. WHEN LOGISTICA fecha uma Carga THEN o sistema SHALL exigir `CargaDespacho` (motorista + caminhão `Trucks` **ativo**) e SHALL rejeitar sem eles ou com caminhão inativo (ver [Frota](../frota/spec.md))
2. WHEN ALMOX prepara expedição THEN o sistema SHALL permitir `AlocacaoIbc` do container na **Carga**, com pedido vazio. A quantidade esperada de cada pedido é a soma no backend de `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM` onde `CODIGO_EMBALAGEM = 251001`. O teto da alocação SHALL ser a soma dessas quantidades nos pedidos elegíveis. O ALMOX SHALL NOT escolher pedido na saída.
3. WHEN a Carga está FECHADA com foto `CargaPedidoIbc` THEN ALMOX MAY vincular e desvincular IBCs na lista da carga enquanto a expedição não estiver fechada, com o progresso do vinculado contra o total; detalhe, alocação e Fechar expedição SHALL ler a elegibilidade e a quantidade esperada só da foto e SHALL NOT consultar o Sapiens. WHEN a Carga está ABERTA THEN detalhe, alocação e Fechar expedição SHALL recusar com `IBC_CARGA_NAO_FECHADA`; WHEN FECHADA sem foto THEN SHALL recusar com `IBC_CARGA_SEM_FOTO_EXPEDICAO` (#297)
4. WHEN a Carga está FECHADA e a quantidade vinculada é igual à soma dos pedidos elegíveis THEN ALMOX MAY fechar expedição (`ExpedicaoIbc`). WHEN a quantidade é diferente THEN o sistema SHALL recusar.
5. WHEN expedição fecha THEN IBCs alocados SHALL passar a **Em viagem** e alocações SHALL tornar-se imutáveis, ainda sem pedido
6. WHEN ALMOX tenta alocar IBC Inapto, Em viagem, no cliente, com entrada pendente, substituído, já vinculado, ou acima do total da carga THEN o sistema SHALL recusar com motivo claro
7. WHEN Carga não tem pedidos com `CODIGO_EMBALAGEM = 251001` na foto `CargaPedidoIbc` (sem IBC ou fechada antes da foto existir) THEN SHALL NOT aparecer na lista de expedição
8. WHEN expedição fecha THEN o sistema SHALL NOT afirmar Custódia no Cliente e SHALL NOT gravar pedido no container
9. WHEN ALMOX abre a lista de expedição IBC THEN o sistema SHALL listar só Cargas `FECHADA` com pelo menos um registro em `CargaPedidoIbc` e sem `ExpedicaoIbc`, lendo esperado e alocado da foto e das alocações numa única consulta ao Postgres, SHALL NOT consultar o Sapiens (#296)
10. WHEN um pedido da foto tem cota de incluso e cota de empréstimo ao mesmo tempo (**Pedido misto**) THEN o sistema SHALL recusá-lo para a soma: ele fica fora do total, aparece como alerta e SHALL NOT derrubar os outros pedidos da carga

**Independent Test**: Logística fecha carga cuja soma elegível é 3 → ALMOX vincula 3 IBCs à carga, sem pedido → Fechar expedição → status Em viagem; o quarto container é recusado; pedido misto não altera a soma; tentar Inapto → erro.

**Tracker**: [#36](https://github.com/Gabr1elaugus700/WorkaPool/issues/36) · Test suite [#56](https://github.com/Gabr1elaugus700/WorkaPool/issues/56)

---

### P1: Volta — pedido apontado e modalidade derivada ⭐ MVP

**User Story**: Como operador ALMOX, quero na volta apontar o pedido de cada container que ficou ou foi trocado, para o sistema derivar incluso ou empréstimo a partir do pedido que o vendedor já definiu.

**Why P1**: O vínculo container↔pedido nasce aqui, transcrevendo o Relatório de Viagem. O ALMOX não escolhe venda nem empréstimo.

**Acceptance Criteria**:

1. WHEN a viagem ainda está aberta THEN a conciliação SHALL listar os containers da carga sem pedido escolhido e os pedidos elegíveis com a quantidade esperada
2. WHEN o destino é ficou ou troca THEN o ALMOX SHALL apontar um pedido elegível daquela carga. WHEN o destino é retornou THEN o sistema SHALL gravar sem pedido
3. WHEN o corpo traz uma modalidade THEN o sistema SHALL recusar. Pedido só incluso SHALL derivar venda. Pedido só empréstimo SHALL derivar empréstimo
4. WHEN o pedido derivado é incluso THEN o container SHALL ir para Custódia no Cliente com baixa no pool, sem prazo e sem aviso
5. WHEN o pedido derivado é empréstimo THEN o container SHALL ir para Custódia no Cliente com Prazo de devolução de **90 dias** UTC a partir do Fechar Viagem, alocação aberta, e o Representante SHALL receber aviso
6. WHEN a quantidade apontada no pedido (ficou + troca) difere da esperada THEN o Fechar Viagem SHALL recusar enquanto aquele pedido não vier com confirmação explícita da divergência. Os outros pedidos da carga SHALL seguir
7. WHEN o pedido é misto THEN ele SHALL permanecer fora dos elegíveis e SHALL NOT derrubar o resto da carga

**Independent Test**: Dois empréstimos e um incluso na mesma carga → aviso só dos empréstimos, com 90 dias; o incluso baixa sem aviso; divergência 1/2 sem confirmação recusa, com confirmação fecha.

---

### P1: Entrada no pátio (mista) + Troca 1:1 ⭐ MVP

**User Story**: Como operador, quero dar entrada no que voltou na viagem — QR conhecido ou cadastro+vínculo de troca — misturando Transbordo/Empréstimo devolvido e Troca na mesma viagem.

**Why P1**: Fecha o ciclo e materializa Troca.

**Acceptance Criteria**:

1. WHEN volta IBC com QR da empresa THEN o sistema SHALL registrar Entrada no pátio e colocá-lo em **Aguardando inspeção**
2. WHEN volta unidade sem QR THEN o operador SHALL cadastrar novo IBC (Aquisição = troca), gerar QR, e vincular 1:1 ao outbound (ex. #H030 → #H067)
3. WHEN o operador vincula Troca THEN a lista padrão de outbound SHALL ser **Pendentes de retorno** daquela viagem/Carga
4. WHEN Troca #H030 → #H067 é confirmada THEN #H030 SHALL sair do pool cobrável da empresa e #H067 SHALL nascer Aguardando inspeção
5. WHEN a mesma viagem tem 5 trocas e 2 retornos com QR THEN o sistema SHALL permitir classificar unidade a unidade

**Independent Test**: Viagem mista → 2 entradas por QR + 1 cadastro #H067 ligado a #H030 pendente.

---

### P1: Aviso ao Representante ⭐ MVP

**User Story**: Como operador no fechamento da volta, quero que o Representante seja avisado só dos containers de empréstimo que ficaram no Cliente, com o pedido apontado na volta.

**Why P1**: Dor original “quem não devolve” / visibilidade comercial.

**Acceptance Criteria**:

1. WHEN após o Fechar Viagem restam IBCs de empréstimo em Custódia no Cliente THEN o sistema SHALL gerar **Aviso ao Representante** daquele Pedido (in-app). Incluso SHALL NOT entrar no aviso
2. WHEN o Representante acessa o WorkaPool THEN SHALL ver o aviso com Pedido, Cliente e identificadores relevantes
3. WHEN o Pedido é incluso THEN o sistema SHALL NOT gerar aviso. WHEN o Pedido é empréstimo THEN o aviso SHALL informar o container, o cliente e o vencimento de 90 dias do pedido apontado na volta

**Independent Test**: Dois empréstimos e um incluso que ficaram → aviso só dos dois empréstimos, com o pedido da volta e o vencimento de 90 dias.

---

### P2: Consulta via QR (página autenticada)

**User Story**: Como usuário autenticado, quero abrir o QR do adesivo e ver dados do IBC (identificador, aptidão, custódia atual, data limite, histórico recente).

**Why P2**: Útil no pátio/campo; MVP pode viver só nas telas do módulo.

**Acceptance Criteria**:

1. WHEN o usuário autenticado abre o link/QR THEN o sistema SHALL exibir ficha do IBC
2. WHEN não autenticado THEN o sistema SHALL exigir login

---

### P2: Painel de Empréstimos em atraso

**User Story**: Como logística/comercial, quero listar Empréstimos com Prazo de devolução vencido.

**Why P2**: Aviso na volta cobre o evento; atraso contínuo é visão de cobrança.

**Acceptance Criteria**:

1. WHEN a data esperada de devolução passou e o IBC segue em Custódia no Cliente (Empréstimo) THEN o IBC SHALL aparecer na lista de atrasados

---

### P3: Override de prazo por Cliente

**User Story**: Como admin, quero prazo padrão por Cliente (em vez de só 90 dias global).

**Why P3**: Hoje não há padrão por Cliente; 90 dias a partir do Fechar Viagem bastam na v1.

---

## Edge Cases

- WHEN a transcrição aponta um IBC que não está Em viagem nesta Carga THEN system SHALL rejeitar ou alertar (não silenciar)
- WHEN Quantidade apontada (ficou + troca) ≠ Quantidade esperada no pedido THEN o Fechar Viagem SHALL recusar sem a confirmação explícita daquele pedido
- WHEN Pedido com IBC tem Volume 0 ou nulo THEN system SHALL tratá-lo como Pedido IBC inválido, fora da soma (não inventar quantidade); os outros pedidos seguem
- WHEN todos os IBCs da Carga retornam THEN não há Pendentes de retorno e não há Troca
- WHEN Empréstimo antigo no mesmo Cliente e volta vazio sem QR THEN Troca pode usar caminho secundário (não default) para quitar pendente antigo — v1 pode documentar como extensão
- WHEN IBC Em viagem não recebe destino na volta THEN a viagem SHALL NOT fechar

---

## Requirement Traceability

| ID | Story | Phase | Status |
| -- | ----- | ----- | ------ |
| IBC-01 | P1 Cadastro/identidade | Design | In Design |
| IBC-02 | P1 Inspeção/Aptidão | Design | In Design |
| IBC-03 | P1 Expedição/Em viagem | Design | In Design |
| IBC-04 | P1 Volta — pedido apontado | Design | In Design |
| IBC-05 | P1 Entrada + Troca 1:1 | Design | In Design |
| IBC-06 | P1 Aviso Representante | Design | In Design |
| IBC-07 | P2 Consulta QR | Design | In Design |
| IBC-08 | P2 Empréstimos atrasados | Design | In Design |
| IBC-09 | P3 Prazo por Cliente | - | Deferred |

**Coverage:** 9 total, 0 mapped to tasks, 1 deferred

---

## Success Criteria

- [ ] Operação responde “onde está o IBC #Hxxx?” com Cliente/pátio/viagem a partir do sistema
- [ ] Nenhum IBC Inapto é alocado em Carga
- [ ] Troca deixa trilha auditável `#out → #in`
- [ ] Representante vê aviso quando Pedido ficou com container após a viagem
- [ ] Glossário do CONTEXT.md respeitado nas telas e APIs (sem “validade do produto” neste módulo)

## Clarifications locked (from grilling)

- Foco = **container** only (sem validade de produto neste módulo)
- **`CODIGO_EMBALAGEM = 251001`** ≠ **Quantidade esperada** — count = backend `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM` (termo `QUANTIDADE_EMBALAGEM` aposentado)
- Modalidade Venda vs Empréstimo via **INCLUSO** (`S` / resto) só em linhas 251001, **derivada na volta** do pedido apontado. Troca só na entrada. O ALMOX não escolhe a modalidade
- **Pedido misto** (incluso e empréstimo no mesmo pedido): recusado, fora do total, sem derrubar o resto da carga
- Inspeção obrigatória a **cada** Entrada no pátio
- **Expedição (epic #374)**: `AlocacaoIbc` é container ↔ carga; o pedido nasce na volta. Cap = soma dos pedidos elegíveis. Relatório em um bloco por pedido, com badge **Incluso** só nesse bloco, sem rótulo de empréstimo ou transbordo. Volta: apontamento do pedido, modalidade derivada, incluso sem aviso, empréstimo com 90 dias e aviso — ver `.specs/features/ibc/context.md`
