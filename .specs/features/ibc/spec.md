# IBC — Especificação (PRD)

**Status**: Approved  
**Tracker**: [Epic #31](https://github.com/Gabr1elaugus700/WorkaPool/issues/31) · Milestone **IBC MVP**

## Problem Statement

A empresa opera com containers IBC (empréstimo, venda, troca, transbordo) sem identidade rastreável. Hoje não dá para responder com confiança: qual IBC está com qual Cliente, quando deveria voltar, se está apto, se a data limite de uso venceu, ou se uma troca substituiu qual ativo. Controle só por “quantidade em estoque” não resolve custódia, qualidade nem inadimplência de devolução.

## Goals

- [ ] Cada IBC do pool tem identidade (número + QR) e histórico de custódia/modalidade/inspeção
- [ ] Operação sabe **IBC X está no Cliente Y** (confirmado na entrega), não só o plano do pátio
- [ ] Empréstimos têm prazo (padrão 30 dias) e Representante é avisado quando containers ficam no Cliente após a viagem
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
| ALMOX (pátio) | Cadastro IBC, Preparação de expedição (`AlocacaoIbc`), Fechar expedição (`ExpedicaoIbc`), Entrada no pátio, Troca 1:1, Inspeção/Aptidão |
| Logística | Fechar Carga com `CargaDespacho` (motorista + caminhão) |
| Motorista | Confirma Custódia no Cliente por Pedido (scan QR) |
| Representante (vendedor) | Recebe Aviso quando IBC do Pedido ficou no Cliente |
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

**User Story**: Como operador ALMOX, quero preparar a expedição de IBCs por pedido em uma Carga e fechar a expedição quando a logística tiver fechado a carga, para que os containers Aptos saiam do pátio (**Em viagem**) com rastreabilidade.

**Why P1**: Início do ciclo de custódia da viagem. Depende de cadastro + aptidão (#32, #35) e fechamento de carga com despacho (#33 MOTORISTA).

**Acceptance Criteria**:

1. WHEN LOGISTICA fecha uma Carga THEN o sistema SHALL exigir `CargaDespacho` (motorista + caminhão `Trucks`) e SHALL rejeitar sem eles
2. WHEN ALMOX prepara expedição THEN o sistema SHALL permitir `AlocacaoIbc` por **Pedido** (`numPed`) — qtd esperada = soma no backend de `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM` onde `CODIGO_EMBALAGEM = 251001`
3. WHEN a Carga está ABERTA THEN ALMOX MAY vincular/desvincular IBCs (progresso parcial visível); Fechar expedição SHALL NOT estar disponível
4. WHEN a Carga está FECHADA e todos os pedidos IBC estão supridos THEN ALMOX MAY fechar expedição (`ExpedicaoIbc`)
5. WHEN expedição fecha THEN IBCs alocados SHALL passar a **Em viagem** e alocações SHALL tornar-se imutáveis
6. WHEN ALMOX tenta alocar IBC Inapto, Em viagem, já vinculado, ou acima do limite THEN o sistema SHALL recusar com motivo claro
7. WHEN Carga não tem pedidos com `CODIGO_EMBALAGEM = 251001` THEN SHALL aparecer na lista sem ações
8. WHEN expedição fecha THEN o sistema SHALL NOT afirmar Custódia no Cliente (motorista confirma na descarga)

**Independent Test**: Logística fecha carga com motorista/caminhão → ALMOX vincula 3 IBCs ao pedido 1120 → Fechar expedição → status Em viagem; tentar Inapto → erro.

**Tracker**: [#36](https://github.com/Gabr1elaugus700/WorkaPool/issues/36) · Test suite [#56](https://github.com/Gabr1elaugus700/WorkaPool/issues/56)

---

### P1: Custódia no Cliente por Pedido (motorista) ⭐ MVP

**User Story**: Como motorista, quero na entrega escolher o Cliente, ver só Pedidos com IBC daquela Carga, e por Pedido escanear os QRs que ficam lá, para registrar a verdade física IBC→Cliente→Pedido.

**Why P1**: Fonte da verdade de localização; resolve João/Maria.

**Acceptance Criteria**:

1. WHEN o motorista abre a Carga e o Cliente da parada THEN o sistema SHALL listar apenas **Pedidos com IBC** (`CODIGO_EMBALAGEM = 251001`)
2. WHEN o Cliente tem Pedido sem embalagem IBC THEN esse Pedido SHALL NÃO aparecer na tela
3. WHEN o Pedido tem quantidade N THEN a tela SHALL mostrar **Quantidade esperada** = N (soma backend de `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM`; distinto de `CODIGO_EMBALAGEM`)
4. WHEN o motorista salva scans do Pedido 1120 THEN o sistema SHALL registrar Custódia no Cliente (IBC + data + Cliente + Pedido) e Quantidade realizada
5. WHEN há 2+ Pedidos com IBC no mesmo Cliente THEN o motorista SHALL lançar e salvar **por Pedido** (ex. 3 no 1120, depois 2 no 1121)
6. WHEN linhas container com **INCLUSO = S** THEN IBCs correspondentes SHALL ser modalidade **Venda**; Senão (**INCLUSO ≠ S**) SHALL ser **Empréstimo** com Prazo de devolução (padrão 30 dias). Split Venda/Empréstimo pode coexistir no mesmo Pedido.

**Independent Test**: Carga com João/1120 (3) e João/1121 (2) → dois lançamentos; Cliente certo no scan mesmo se o “plano mental” do pátio fosse outro.

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

**User Story**: Como operador no fechamento da volta, quero que o Representante do Pedido seja avisado quando containers daquele Pedido ficaram no Cliente (não voltaram no caminhão).

**Why P1**: Dor original “quem não devolve” / visibilidade comercial.

**Acceptance Criteria**:

1. WHEN após Entrada/fechamento da viagem restam IBCs em Custódia no Cliente para um Pedido THEN o sistema SHALL gerar **Aviso ao Representante** daquele Pedido (in-app)
2. WHEN o Representante acessa o WorkaPool THEN SHALL ver o aviso com Pedido, Cliente e identificadores relevantes
3. WHEN o Pedido era Venda (embalagem inclusa) THEN NÃO SHALL tratar como obrigação de devolução (aviso informativo de saída definitiva vs Empréstimo — ver design)

**Independent Test**: Pedido W com 2 IBCs em custódia e 0 na entrada → aviso para o codRep do Pedido W.

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

**User Story**: Como admin, quero prazo padrão por Cliente (em vez de só 30 dias global).

**Why P3**: Hoje não há padrão por Cliente; 30 dias global basta na v1.

---

## Edge Cases

- WHEN motorista escaneia IBC que não está Em viagem nesta Carga THEN system SHALL rejeitar ou alertar (não silenciar)
- WHEN Quantidade realizada ≠ Quantidade esperada THEN system SHALL permitir salvar com indicação de divergência (não travar a rua sem regra explícita de bloqueio — default: avisar)
- WHEN Pedido com IBC tem Volume 0 ou nulo THEN system SHALL tratar como dados inválidos para tela de descarga (não inventar quantidade)
- WHEN todos os IBCs da Carga voltam com QR (só Transbordo) THEN não há Pendentes de retorno e não há Troca
- WHEN Empréstimo antigo no mesmo Cliente e volta vazio sem QR THEN Troca pode usar caminho secundário (não default) para quitar pendente antigo — v1 pode documentar como extensão
- WHEN IBC Em viagem nunca é escaneado em Cliente nem entra no pátio THEN permanece Em viagem / exceção operacional (lista de inconsistência)

---

## Requirement Traceability

| ID | Story | Phase | Status |
| -- | ----- | ----- | ------ |
| IBC-01 | P1 Cadastro/identidade | Design | In Design |
| IBC-02 | P1 Inspeção/Aptidão | Design | In Design |
| IBC-03 | P1 Expedição/Em viagem | Design | In Design |
| IBC-04 | P1 Custódia por Pedido | Design | In Design |
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
- Modalidade Venda vs Empréstimo via **INCLUSO** (`S` / resto) só em linhas 251001; Troca só na entrada
- Inspeção obrigatória a **cada** Entrada no pátio
- **Expedição (ago/2026)**: `CargaDespacho` + `AlocacaoIbc` (por pedido, cap = total) + `ExpedicaoIbc`; ALMOX prepara/fecha; LOGISTICA fecha carga; v1 sem reabrir carga — ver `.specs/features/ibc/context.md`
