# IBC — Context (decisões de grilling)

Decisões de produto já fechadas. Não reabrir sem novo grill.

## Locked (jul/2026)

1. IBC = ativo serializado (número + QR); estoque é projeção
2. Foco = **container**; **não** modelar validade/shelf life do produto neste módulo
3. **Embalagem IBC** no Sapiens (campos reais): `CODIGO_EMBALAGEM` (`der.usu_codemb`) = **251001** identifica linha container; `VOLUME_EMBALAGEM` (`der.usu_qtdmve`) + `QUANTIDADE_PEDIDO` (`ipd.qtdped`) alimentam o cálculo; `INCLUSO` (`ipd.usu_embinc`) só em 251001. **Quantidade esperada de IBC** = soma no **backend** de `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM` por linha container (não na SQL; termo inventado `QUANTIDADE_EMBALAGEM` aposentado). Código legado 251004 descartado.
4. Modalidades: Transbordo, Empréstimo, Venda (Embalagem inclusa), Troca 1:1
5. Fluxo: Expedição (Alocação por Pedido) → Em viagem → Custódia por Pedido (motorista) → Entrada mista no pátio
6. Troca: Pendentes de retorno da viagem; `#out → #in`; Aquisição compra|troca; outbound sai do pool
7. Inspeção obrigatória no cadastro e em **toda** Entrada; nasce/reentra Aguardando inspeção
8. Score por fator do **catálogo de checklist** (cadastrável) + regra híbrida; alertas Inapto na tela do módulo
9. Prazo Empréstimo padrão 30 dias (v1)
10. Aviso ao Representante in-app pós-viagem quando IBC ficou no Cliente
11. Role **MOTORISTA** no Identity (Prisma `Role`) para descarga / Custódia no Cliente

## Locked — Expedição (ago/2026, intervalo fechar carga → Em viagem)

Grill concluído. Issue: [#36](https://github.com/Gabr1elaugus700/WorkaPool/issues/36) · Test suite: [#56](https://github.com/Gabr1elaugus700/WorkaPool/issues/56)

### Atores e papéis

| Papel | Ação neste intervalo |
|-------|----------------------|
| **LOGISTICA** | Fecha a Carga (`FECHADA`) com **`CargaDespacho`** obrigatório (caminhão) |
| **ALMOX** | Prepara vínculos IBC↔Pedido; **Fechar expedição** (`ExpedicaoIbc`) |
| **MOTORISTA** | Role permanece no Identity; **v1 sem gate no fechar carga** e sem UI de custódia IBC (grill set/2026) |

### Entidades

| Entidade | Propósito |
|----------|-----------|
| **`CargaDespacho`** | Tabela intermediária: carga + caminhão (`Trucks`) + auditoria; `motoristaId` **opcional na v1**. 1:1 por carga. `Caminhao` (fretes) é **depreciado** — usar `Trucks`. Alinhamento de código: [#89](https://github.com/Gabr1elaugus700/WorkaPool/issues/89). |
| **`AlocacaoIbc`** | Vínculo IBC ↔ **Pedido** (`numPed`) dentro de uma carga. **Não** vínculo por item de pedido. |
| **`ExpedicaoIbc`** | Registro do fechamento da expedição; IBCs alocados passam a **Em viagem**; alocações ficam imutáveis. |

### Regras de negócio

1. **Fechar carga** exige caminhão ativo (`Trucks`); sem `CargaDespacho` → rejeita. **v1:** `User` MOTORISTA **não** é obrigatório (decisão triage 2026-09-04 / epic #31 set/2026; implementação: #89). Código legado ainda pode exigir motorista até #89.
2. **Preparação** pode começar em carga `ABERTA` (progresso parcial visível, ex. "2/3 IBCs").
3. **Fechar expedição** só quando carga `FECHADA` + cada pedido com IBC tem qtd vinculada = qtd esperada.
4. **Qtd esperada por pedido** = soma no backend de `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM` nas linhas com `CODIGO_EMBALAGEM = 251001`. Expor também split `quantidadeEsperadaVenda` (INCLUSO=S) e `quantidadeEsperadaEmprestimo` (resto). Alocação / Fechar expedição usam o **total** nesta fatia.
5. Pedidos **sem** linha IBC: **não aparecem** na tela de alocação.
6. Cargas **sem pedidos IBC**: aparecem na lista com indicador visual, **sem ações**.
7. **Bloqueios no vínculo**: Inapto, Em viagem, já vinculado a outra carga, excede limite do pedido.
8. **Desvincular** permitido antes de `ExpedicaoIbc`; após fechamento, imutável.
9. **Desktop**: digitação manual do código; **web**: scan QR.
10. **v1: sem reabrir carga** — alocações não revertem por reabertura.
11. Atribuição física container→cliente **não** acontece na preparação; na viagem v1 o motorista preenche o **Relatório de Viagem PDF** (#37), sem login — conciliação na volta é #38.
12. **Pedido IBC inválido** (volume ≤ 0 ou divisão não inteira em linha 251001): bloqueia IBC naquele Pedido + **alerta ao ALMOX**; demais Pedidos da Carga seguem.
13. **INCLUSO**: só em 251001; `"S"` → Venda; qualquer outro → Empréstimo. Troca **não** é modalidade de saída.

### Sapiens (implementação em `QUERY_GET_PEDIDOS_BY_CARGA`)

- `der.usu_codemb` AS **CODIGO_EMBALAGEM** — `251001` = container
- `der.usu_qtdmve` AS **VOLUME_EMBALAGEM** — divisor
- `ipd.qtdped` AS **QUANTIDADE_PEDIDO** — numerador (já existe como QUANTIDADE na query; mapear no mapper IBC)
- `ipd.usu_embinc` AS **INCLUSO** — S / N (null/lixo → N)
- Cálculo e flags **somente no backend**, só para linhas 251001
- Não enriquecer `QUERY_GET_PEDIDOS_BASE` / por rep nesta fatia
- Discovery formal: issue [#34](https://github.com/Gabr1elaugus700/WorkaPool/issues/34) · seam ticket [#58](https://github.com/Gabr1elaugus700/WorkaPool/issues/58)

## Locked — Sapiens packaging math (ago/2026 grill)

Grill fechado. Substitui o modelo `SUM(QUANTIDADE_EMBALAGEM)`.

DTO alvo por Pedido (agregado no mapper):

```ts
{
  isContainer: boolean
  quantidadeEsperadaTotal: number
  quantidadeEsperadaVenda: number
  quantidadeEsperadaEmprestimo: number
}
```

## Implantação em camadas (ago/2026)

Desenvolvimento **vertical por capacidade** (API + UI da fatia), não o ciclo inteiro de uma vez.

**Camada 1 — identidade, pool no pátio, qualidade**:
- Spec: IBC-01 (cadastro) + IBC-02 (checklist, inspeção, aptidão, histórico, alertas)
- Issues: #32 + #35

**Camada 2 — expedição (fechar carga → Em viagem)**:
- Spec: IBC-03 (expedição)
- Issues: #36 (bloqueada por #32, #35, #33) · test suite #56
- Inclui extensão do módulo **Cargo** (`CargaDespacho` no `closeCarga`)
- Cadastro operacional de caminhões: [Frota spec](../frota/spec.md) (`Trucks`, `/api/trucks`, tela `/frota`, regra `active`)

**Fora destas camadas**: Relatório de Viagem PDF (#37), Fechar Viagem/entrada/troca (#38), aviso representante (#39), ficha QR (#40 descontinuada), empréstimos atrasados (#41). Alinhamento motorista opcional no close: [#89](https://github.com/Gabr1elaugus700/WorkaPool/issues/89).

Perguntas estacionadas até camada de viagem: aviso em Venda, scan fora da carga, reabrir carga.

## Locked — Orquestração ERP × WorkaPool (set/2026 grill)

Grill fechado. Decisão-mãe: **SoT dual** — não sincronizar nem igualar os dois “estoques”.

### Princípio

| Sistema | Fonte da verdade |
|---------|------------------|
| **Sapiens (ERP)** | Posse fiscal/patrimonial do produto `codpro` **251001** (cadastro/entrada sempre via NF). |
| **WorkaPool** | Identidade serializada + custódia + aptidão + obrigação de devolução. |

- Totais **não precisam ser iguais**; precisam ser **reconciliáveis** (gap explicável por buckets).
- WorkaPool é verdade da **quantidade física identificada**; ERP é verdade do **papel fiscal**.
- **Escrita** de estoque/fiscal no ERP: **proibida**. Leitura do saldo ERP: **permitida** (consulta trazida pelo owner / webserver Sapiens).
- `251001` é o **`codpro`** do produto-container no ERP. O mesmo número já aparece como `CODIGO_EMBALAGEM` (`der.usu_codemb`) na linha do químico — **não misturar as leituras**: saldo via estoque do `codpro`; qtd esperada na expedição continua na math de embalagem do pedido.

### O que não fazer

- Cap duro “WP ≤ saldo ERP”
- Sincronizar os dois estoques como se fossem o mesmo número
- Import automático NF → criar ativos sem operador
- Lote de retorno / troca em massa

### Ciclo de vida vs saldo ERP (hoje)

| Evento | Saldo ERP (`251001`) |
|--------|----------------------|
| NF entrada (compra) | Sobe |
| Venda (`INCLUSO=S`) | Desce |
| Empréstimo (fica no cliente) | Não mexe |
| Troca 1:1 (entra vazio sem NF) | Não mexe |
| Baixa/descarte no pátio | Só se houver baixa manual no ERP |

### Cadastro

| Fluxo | Regra |
|-------|--------|
| **Lote (compra)** | UI: Entrada → N novos → `dataLimite` única do lote → **NF opcional** (rastro no WP) → gera N identificadores. Defaults iguais ao cadastro unitário: `Aquisição=COMPRA`, `tipoCadastro=NOVO`, `custodia=PATIO`, `AGUARDANDO_INSPECAO` (Inapto). |
| **Unitário** | Continua (#32). |
| **Troca** | **Sem lote.** Na volta (#38): X vazios para cadastrar; cada `#in` vinculado 1:1 a um `#out` pendente daquele cliente/viagem. |
| **Estoque legado no pátio** | Serializar com um ou mais **lotes de compra** (mesmo sem NF histórica no fluxo). |

### Aviso no lote (não bloqueio)

Ao criar N: se `(IBCs vivos WP + N) > saldo ERP(251001)` → **avisa e deixa salvar**.

**Vivos WP** = `baixadoEm IS NULL` e ainda no pool da empresa: pátio + em viagem + no cliente (empréstimo). **Fora:** baixados; **venda já baixada no pool WP**; outbound de troca já substituído.

### Baixa por venda no pool WorkaPool

**Não** no Fechar expedição.

No **retorno do caminhão**, quando o ALMOX confere o Relatório de Viagem preenchido pelo motorista, marca o que ficou em cada cliente e faz o vínculo — momento do **Fechar Viagem** (#38). Aí o outbound em modalidade **Venda** sofre **baixa no estoque/pool do WorkaPool** (sai dos vivos). Empréstimo que ficou permanece vivo (Custódia no Cliente). Troca: `#out` sai do pool cobrável; `#in` entra como ativo novo.

### Conciliação por buckets

**Fora** da fatia do lote/cadastro. Depois que Empréstimo / Venda / Troca existirem de verdade (#38+): tela ERP vs WP por buckets (pátio, viagem, cliente, vendidos, troca, baixados, NF sem serializar / serial sem NF).

### Issues

- Epic: [#31](https://github.com/Gabr1elaugus700/WorkaPool/issues/31)
- Cadastro unitário: [#32](https://github.com/Gabr1elaugus700/WorkaPool/issues/32)
- Cadastro em lote + aviso: [#117](https://github.com/Gabr1elaugus700/WorkaPool/issues/117)
- Seam saldo ERP `251001`: [#118](https://github.com/Gabr1elaugus700/WorkaPool/issues/118)
- Fechar Viagem / baixa por venda / Troca 1:1: [#38](https://github.com/Gabr1elaugus700/WorkaPool/issues/38)
- Conciliação buckets (P2): [#119](https://github.com/Gabr1elaugus700/WorkaPool/issues/119)
