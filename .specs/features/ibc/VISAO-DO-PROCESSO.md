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

> Cada IBC ganha identidade; o pátio registra o que saiu na carga; o motorista confirma o que ficou em cada cliente; na volta o pátio dá entrada no que retornou (incluindo trocas); qualidade libera ou bloqueia o próximo uso; o vendedor é avisado quando o container ficou com o cliente.

---

## Quem faz o quê?

| Quem | O que faz neste processo |
| ---- | ------------------------ |
| **Pátio / Almox** | Cadastra containers, cola adesivo QR, inspeciona qualidade, monta a carga com os IBCs, dá entrada na volta e registra trocas |
| **Motorista** | No descarregamento, informa em qual cliente ficou qual container (lendo o QR), pedido a pedido |
| **Vendedor (representante)** | Recebe aviso quando, na volta da viagem, containers do pedido dele ficaram no cliente |
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
| **Empréstimo** | O container **fica** com o cliente e **o mesmo número** deve voltar depois (prazo padrão: **30 dias**) |
| **Venda** | O container vai junto com a venda (embalagem inclusa) e **não precisa voltar** |
| **Troca** | Sai um container nosso; volta **outro** (do cliente), sem nosso adesivo. No pátio cadastramos o novo e ligamos: “o H030 foi trocado pelo H067” |

Na mesma viagem pode misturar casos (ex.: 2 transbordos + 5 trocas). O pátio classifica cada um na entrada.

**Como o sistema sabe se é venda ou empréstimo?**  
Pelo pedido: se a embalagem está **inclusa**, é venda do container; se não, é empréstimo.

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

### 2. Montagem da carga (pátio)

1. O operador abre a **carga** no WorkaPool (celular/web).  
2. Informa **quais IBCs Aptos** estão subindo naquela carga.  
3. Fecha o lançamento.  

Nesse momento o sistema entende: esses containers **não estão mais no pátio** — estão **em viagem**.  
Ainda **não** sabemos em qual cliente cada um vai parar (isso o motorista confirma na entrega).

---

### 3. Descarregamento (motorista)

1. O motorista sabe a carga e os pedidos que está levando.  
2. No cliente, abre a parada daquele cliente.  
3. Vê **somente os pedidos que usam embalagem IBC** (pedido só de outro tipo de embalagem **não aparece**, para não confundir).  
4. Se o cliente tem **mais de um pedido com IBC** (ex.: pedido 1120 com 3 containers e 1121 com 2), lança **separado**:  
   - 3 QRs no 1120 → salva  
   - 2 QRs no 1121 → salva  
5. A tela mostra **quantos eram esperados** naquele pedido (informação que já vem do pedido) e o motorista confirma lendo os QRs dos que **ficam** no cliente.

**O que isso resolve:** se no pátio “achavam” que o container 1 era da Maria, mas o motorista descarregou no João, **vale o que foi lido no João**. A verdade é a entrega, não o chute da montagem.

Containers que **voltam no caminhão** (transbordo) **não** são marcados como “ficou no cliente”.

---

### 4. Volta ao pátio

O caminhão chega. O operador dá **entrada** no que voltou. Podem existir misturas:

| O que veio | O que o pátio faz |
| ---------- | ----------------- |
| Container **com nosso QR** | Dá entrada → volta a **aguardar inspeção** (transbordo ou devolução de empréstimo) |
| Container **sem nosso QR** (veio do cliente) | Cadastra como novo (origem: **troca**), cola adesivo novo, e **amarra** ao nosso que ficou lá: “H030 foi trocado pelo H067”. O H030 deixa de ser nosso para cobrança de devolução |

Lista de apoio na troca: primeiro os containers **pendentes de retorno daquela viagem** (os que o motorista marcou como ficaram no cliente e não voltaram com QR).

---

### 5. Aviso ao vendedor

Quando a viagem é fechada na volta:

- Se containers de um pedido **ficaram no cliente** (não voltaram no caminhão), o **vendedor daquele pedido** recebe um **aviso no WorkaPool**.  
- Assim o comercial acompanha o que está “lá fora” sem depender só de planilha ou memória.

Depois, empréstimos que passam dos **30 dias** também podem aparecer em uma visão de **atrasados** (acompanhamento contínuo).

---

## Alertas que o time vê na tela

O módulo destaca, com o **número do container**:

- Aguardando inspeção  
- Reprovado na inspeção (Inapto)  
- Data limite de uso vencida ou próxima da política definida  

Container **Inapto não sobe em carga nova**.

---

## Exemplo narrado (uma viagem)

1. Pátio inspeciona e libera H010, H011, H012.  
2. Monta a carga 500 e vincula esses três → ficam **em viagem**.  
3. No cliente João: pedido 1120 esperava 2 IBCs; motorista lê H010 e H011 → ficam com João (empréstimo, 30 dias).  
4. H012 fez **transbordo** (produto descarregado, container voltou no caminhão).  
5. No pátio: entrada do H012 (com QR) → aguarda inspeção de novo.  
6. João devolveu um vazio **sem adesivo nosso** no lugar de um que ficou: pátio cadastra H050 (troca), liga “H010 ↔ H050”, H010 sai da nossa conta cobrável.  
7. Vendedor do pedido 1120 recebe aviso do que ficou / da situação da viagem.

---

## O que melhora no dia a dia

| Antes (dor) | Depois (processo) |
| ----------- | ----------------- |
| “Quem não devolveu?” sem clareza | Empréstimo com prazo + avisos + lista de atrasados |
| “Qual container foi pra qual cliente?” | Confirmação do motorista com QR na entrega |
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
| **Em viagem** | Saiu na carga; ainda não confirmado no cliente nem na entrada do pátio |
| **Custódia no cliente** | Motorista confirmou: este IBC ficou neste cliente neste pedido |
| **Pendente de retorno** | Ficou no cliente nesta viagem e ainda não voltou com nosso QR |
| **Apto / Inapto** | Pode ou não circular / subir em carga |
| **Data limite de uso** | Até quando **este recipiente** pode ser usado |
| **Prazo de devolução** | Até quando o **empréstimo** deveria voltar (padrão 30 dias) |

---

## Como acompanhar a entrega do projeto

A demanda está organizada no GitHub no marco **IBC MVP**, com um Epic e tickets por etapa do processo (cadastro → qualidade → carga → motorista → volta → avisos).

Para o time de produto: este documento é a **visão do processo**; a especificação detalhada de requisitos fica em paralelo para o time de desenvolvimento.

---

*Versão alinhada às decisões de processo do módulo IBC (WorkaPool).*
