# Controle de Containers IBC — Visão do processo

Documento para **produto e operação**. Explica como o dia a dia vai funcionar no WorkaPool — sem detalhes técnicos de sistema.

---

## Por que isso existe?

Hoje os containers IBC circulam, mas fica difícil responder com segurança:

- Qual container está com qual cliente?
- Quando deveria ter voltado?
- Esse container ainda pode ser usado (qualidade / data limite)?
- Foi empréstimo, venda, troca ou só descarregou o produto e o mesmo voltou?

Contar “quantos containers temos” não resolve isso. O novo processo trata **cada container como uma unidade identificada** (número + adesivo com QR) e acompanha o caminho dele do pátio ao cliente e de volta.

---

## Em uma frase

> Cada IBC ganha identidade; na saída a carga leva só o conjunto de containers; o motorista marca no relatório qual container ficou em qual pedido; na volta o pátio aponta o pedido e dá entrada no que retornou (incluindo trocas); qualidade libera ou bloqueia o próximo uso; o vendedor é avisado só no empréstimo.

---

## Quem faz o quê?

| Quem | O que faz neste processo |
| ---- | ------------------------ |
| **Pátio / Almox** | Cadastra containers, cola adesivo QR, inspeciona qualidade, monta a carga com o conjunto de IBCs (sem escolher pedido), na volta aponta o pedido do papel, dá entrada no que retornou e registra trocas |
| **Motorista** | No papel da viagem, marca em cada bloco de pedido o que ficou e o que foi troca. Não entra no sistema |
| **Vendedor (representante)** | Recebe aviso só quando, na volta, um container de empréstimo do pedido dele ficou no cliente |
| **Gestão / Logística** | Acompanha alertas (container inapto, data limite, empréstimos em atraso) |

---

## O que é um “IBC” neste processo?

É o **recipiente físico** (container), não o produto químico dentro dele.

Cada um tem:

- **Número identificador** (ex.: H030) — legível no adesivo  
- **QR Code** — abre as informações no WorkaPool (com login)  
- **Data limite de uso** — até quando aquele recipiente pode circular  
- **Situação de uso**: Apto ou Inapto  
- **De onde veio**: compra ou troca  

A validade do produto químico **não** entra neste módulo — o foco é só o container.

---

## Quatro situações de negócio (como a operação já fala)

| Situação | O que acontece na prática |
| -------- | ------------------------- |
| **Transbordo** | Descarrega o produto no cliente e **traz o mesmo** container de volta |
| **Empréstimo** | O container **fica** com o cliente e **o mesmo número** deve voltar depois (prazo: **90 dias** a partir da volta) |
| **Venda** | O container vai junto com a venda (embalagem inclusa) e **não precisa voltar** |
| **Troca** | Sai um container nosso; volta **outro** (do cliente), sem nosso adesivo. No pátio cadastramos o novo e ligamos: “o H030 foi trocado pelo H067” |

Na mesma viagem pode misturar casos. O pátio não escolhe a modalidade na saída: na volta aponta o pedido, e a regra do pedido decide.

No papel, **transbordo e empréstimo não são rótulo**. O container que volta no caminhão simplesmente não é marcado como ficou nem como troca. Empréstimo também não leva nome no papel — só o pedido incluso mostra o badge **Incluso**.

**Como o sistema sabe se é venda ou empréstimo?**  
Pelo pedido apontado na volta: se a embalagem está **inclusa**, é venda do container (baixa, sem aviso); se não, é empréstimo (90 dias e aviso). Pedido com as duas cotas ao mesmo tempo é **pedido misto**: fica de fora da conta e não impede o resto da carga.

---

## O ciclo completo (passo a passo)

### 1. Nascimento do container no pátio

1. O pátio cadastra o IBC (ou recebe um de troca).  
2. Cola o adesivo com número + QR.  
3. O container fica **aguardando inspeção** (ainda não pode ir para viagem).  
4. Alguém do pátio faz a **inspeção de qualidade** (checklist do POP, com nota de 0 a 10 em cada item).  
5. Se passar → **Apto**. Se não → **Inapto** (aparece em alerta com o número do container).

**Regra de ouro:** todo container que **entra** no pátio (cadastro novo ou retorno de viagem) **passa de novo** pela inspeção antes da próxima viagem.

O checklist (coloração, registro, bolsa, base, tampa, grade, etc.) pode ganhar **novos itens** ao longo do tempo — é cadastrável, alinhado ao POP de qualidade.

---

### 2. Montagem da carga (pátio + logística)

**Antes — logística fecha a carga:**

1. A logística monta a carga (pedidos) e, ao fechar, **obrigatoriamente** informa **motorista** e **caminhão**.
2. A carga passa a situação **FECHADA**.

**Preparação — ALMOX vincula os containers à carga:**

1. O ALMOX abre a carga já **FECHADA** no WorkaPool.
2. Informa quais containers sobem — escaneando QR (web) ou digitando o código (desktop) — **sem escolher pedido**.
3. A tela é uma lista da carga: o que já foi vinculado contra o total esperado (a soma dos pedidos elegíveis). Não há card por pedido.
4. **Pedido misto** (incluso e empréstimo no mesmo pedido) aparece como alerta, fica fora desse total e não impede o restante da carga.
5. Só quando a quantidade vinculada é **exatamente** esse total, o ALMOX **fecha a expedição**. Quantidade diferente não fecha.

Nesse momento o sistema entende: esses containers **não estão mais no pátio** — estão **em viagem**, ainda **sem pedido**.  
Qual container ficou em qual pedido é o que o motorista marca no papel; o vínculo no sistema nasce na volta.

**Cargas sem pedido IBC:** não entram na lista de expedição.

---

### 3. O papel (Relatório de Viagem)

Depois que a expedição fecha, o papel sai em **um bloco por pedido**. Dois pedidos do mesmo cliente são dois blocos. A ordem dos blocos segue a ordem de entrega da carga.

Cada bloco mostra o cliente, o número do pedido, a quantidade esperada e a **lista inteira** de containers da carga, de novo, com os identificadores em ordem.

- No bloco de pedido **incluso**, cada linha traz o badge **Incluso**, antes de qualquer marcação.
- No bloco de **empréstimo** não há modalidade.
- Nada vem marcado. Cada linha tem uma caixa de **ficou** e uma caixa de **troca**, vazias.
- Não existe rótulo de empréstimo, de transbordo nem de retorno.

O motorista marca no papel, no bloco do pedido, o que ficou e o que foi troca. O sistema não pede login de motorista. O PDF é só o papel: o servidor não guarda arquivo.

---

### 4. Volta ao pátio

O caminhão chega com o papel marcado. O ALMOX transcreve, container a container, e **aponta o pedido** — é aqui que o vínculo nasce. Ninguém escolhe venda ou empréstimo: a modalidade sai do pedido.

| O que o papel diz | O que o pátio faz |
| ----------------- | ----------------- |
| **Ficou** ou **troca** num pedido **incluso** | Aponta esse pedido. O container fica no cliente, sai do pool (baixa) e **não** gera prazo nem aviso |
| **Ficou** ou **troca** num pedido de **empréstimo** | Aponta esse pedido. O container fica no cliente, com prazo de **90 dias** e aviso ao vendedor |
| **Voltou** no caminhão | Não aponta pedido. Dá entrada → volta a **aguardar inspeção** |
| Container **sem nosso QR** (veio do cliente) | Cadastra como novo (origem: **troca**), cola adesivo novo, e **amarra** ao nosso que ficou: “H030 foi trocado pelo H067”. O que ficou segue a regra do pedido apontado |

Se num pedido a quantidade apontada (ficou + troca) for diferente da esperada, a viagem só fecha com a **confirmação** dessa divergência. Os outros pedidos da carga seguem. Pedido misto não entra nessa conta.

Lista de apoio na troca: primeiro os containers **pendentes de retorno daquela viagem** (os que ficaram no cliente e não voltaram com o nosso QR).

---

### 5. Aviso ao vendedor

Quando a viagem é fechada na volta:

- Só o **empréstimo** gera aviso. O vendedor daquele pedido vê, no WorkaPool, o container, o cliente e o vencimento de **90 dias**.
- **Incluso não gera aviso.**

Depois, empréstimos que passam dos **90 dias** também podem aparecer em uma visão de **atrasados** (acompanhamento contínuo).

---

## Alertas que o time vê na tela

O módulo destaca, com o **número do container**:

- Aguardando inspeção  
- Reprovado na inspeção (Inapto)  
- Data limite de uso vencida ou próxima da política definida  

Container **Inapto não sobe em carga nova**.

---

## Exemplo narrado (uma viagem)

1. Logística fecha a carga 500 (caminhão).  
2. ALMOX vincula H010, H011 e H012 **à carga**, sem escolher pedido, e fecha a expedição. Ficam **em viagem**.  
3. O papel sai em bloco por pedido. No bloco de empréstimo não há modalidade; no bloco incluso cada linha traz o badge **Incluso**. Nada vem marcado. O motorista marca no papel o que ficou e o que foi troca.  
4. Na volta o ALMOX aponta: H010 ficou no pedido de empréstimo (90 dias e aviso) e H012 ficou no pedido incluso (baixa, sem aviso). H011 voltou no caminhão — sem rótulo de transbordo — e entra no pátio para nova inspeção.  
5. João devolveu um vazio **sem adesivo nosso** no lugar de um que ficou: pátio cadastra H050 (troca), liga “H010 ↔ H050”. O que ficou segue a regra do pedido apontado.  
6. O vendedor recebe aviso só do empréstimo, com o pedido da volta.

---

## O que melhora no dia a dia

| Antes (dor) | Depois (processo) |
| ----------- | ----------------- |
| “Quem não devolveu?” sem clareza | Empréstimo com prazo + avisos + lista de atrasados |
| “Qual container foi pra qual cliente?” | Marca no papel, por pedido; o pátio aponta o pedido na volta |
| Troca e transbordo misturados na cabeça | Entrada no pátio classifica e documenta |
| Qualidade só no papel / POP solto | Inspeção obrigatória + histórico de notas + alertas |
| Data limite do recipiente esquecida | Alerta no módulo; bloqueio para nova viagem |

---

## O que este processo **não** cobre (de propósito)

- Validade / validade de lote do **produto químico**  
- App nativo só de motorista (usa o WorkaPool no celular, pelo navegador)  
- Impressão em massa de etiquetas (o sistema gera identidade/QR; a colagem é operação)  
- Aviso por e-mail/WhatsApp na primeira versão (aviso **dentro** do WorkaPool)

---

## Glossário rápido (linguagem da operação)

| Termo | Significado simples |
| ----- | ------------------- |
| **Preparação de expedição** | ALMOX vincula containers Aptos à carga, sem escolher pedido |
| **Fechar expedição** | A quantidade vinculada é o total da carga; containers passam a **em viagem**, ainda sem pedido |
| **Relatório de Viagem** | Um bloco por pedido, com a lista inteira da carga. Badge **Incluso** só no bloco incluso. Sem rótulo de empréstimo ou transbordo. Caixas de ficou e de troca vazias |
| **CargaDespacho** | Caminhão informado pela logística ao fechar a carga |
| **Em viagem** | Fechou expedição; o pedido ainda não foi apontado |
| **Custódia no cliente** | Na volta, o ALMOX apontou o pedido: este IBC ficou neste cliente neste pedido. Incluso baixa sem aviso; empréstimo fica 90 dias e gera aviso |
| **Pedido misto** | O mesmo pedido tem cota de incluso e de empréstimo. Fica fora do total e não derruba o resto da carga |
| **Pendente de retorno** | Ficou no cliente nesta viagem e ainda não voltou com nosso QR |
| **Apto / Inapto** | Pode ou não circular / subir em carga |
| **Data limite de uso** | Até quando **este recipiente** pode ser usado |
| **Prazo de devolução** | Até quando o **empréstimo** deveria voltar (**90 dias** a partir da volta) |

---

## Como acompanhar a entrega do projeto

A demanda está organizada no GitHub no marco **IBC MVP**, com um Epic e tickets por etapa do processo (cadastro → qualidade → carga → motorista → volta → avisos).

Para o time de produto: este documento é a **visão do processo**; a especificação detalhada de requisitos fica em paralelo para o time de desenvolvimento.

---

*Versão alinhada às decisões de processo do módulo IBC (WorkaPool).*
