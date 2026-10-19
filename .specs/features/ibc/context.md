# IBC — Context (decisões de grilling)

Decisões de produto já fechadas. Não reabrir sem novo grill.

## Locked (jul/2026)

1. IBC = ativo serializado (número + QR); estoque é projeção
2. Foco = **container**; **não** modelar validade/shelf life do produto neste módulo
3. **Embalagem IBC** no Sapiens (campos reais): `CODIGO_EMBALAGEM` (`der.usu_codemb`) = **251001** identifica linha container; `VOLUME_EMBALAGEM` (`der.usu_qtdmve`) + `QUANTIDADE_PEDIDO` (`ipd.qtdped`) alimentam o cálculo; `INCLUSO` (`ipd.usu_embinc`) só em 251001. **Quantidade esperada de IBC** = soma no **backend** de `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM` por linha container (não na SQL; termo inventado `QUANTIDADE_EMBALAGEM` aposentado). Código legado 251004 descartado.
4. Modalidades: Transbordo, Empréstimo, Venda (Embalagem inclusa), Troca 1:1. No papel da viagem só o badge **Incluso** aparece; empréstimo e transbordo não são rótulo.
5. Fluxo: Expedição (container ↔ carga, sem pedido) → Em viagem → Relatório em bloco por pedido → na volta o ALMOX aponta o pedido e a modalidade é derivada → Entrada mista no pátio
6. Troca: Pendentes de retorno da viagem; `#out → #in`; Aquisição compra|troca; outbound sai do pool
7. Inspeção obrigatória no cadastro e em **toda** Entrada; nasce/reentra Aguardando inspeção
8. Score por fator do **catálogo de checklist** (cadastrável) + regra híbrida; alertas Inapto na tela do módulo
9. Prazo Empréstimo: **90 dias** UTC a partir do **Fechar Viagem** (não da saída)
10. Aviso ao Representante in-app só no **empréstimo** que ficou no Cliente; incluso não gera aviso
11. Role **MOTORISTA** permanece no Identity; na v1 o motorista marca o Relatório de Viagem no papel, sem login

## Locked — Expedição (ago/2026, corrigido out/2026 pela epic #374)

Grill da expedição, corrigido pela epic #374. **`AlocacaoIbc` é container ↔ carga; o pedido nasce na volta.** Issues: [#36](https://github.com/Gabr1elaugus700/WorkaPool/issues/36) · [#374](https://github.com/Gabr1elaugus700/WorkaPool/issues/374).

### Atores e papéis

| Papel | Ação neste intervalo |
|-------|----------------------|
| **LOGISTICA** | Fecha a Carga (`FECHADA`) com **`CargaDespacho`** obrigatório (caminhão) |
| **ALMOX** | Prepara o conjunto de containers da carga, **sem escolher pedido**; **Fechar expedição** (`ExpedicaoIbc`). Na volta, aponta o pedido do papel. |
| **MOTORISTA** | Marca o Relatório de Viagem no papel. **v1 sem login** e sem gate no fechar carga. |

### Entidades

| Entidade | Propósito |
|----------|-----------|
| **`CargaDespacho`** | Tabela intermediária: carga + caminhão (`Trucks`) + auditoria; `motoristaId` **opcional na v1**. 1:1 por carga. `Caminhao` (fretes) é **depreciado** — usar `Trucks`. Alinhamento de código: [#89](https://github.com/Gabr1elaugus700/WorkaPool/issues/89). |
| **`AlocacaoIbc`** | Vínculo IBC ↔ **Carga**. Na saída o pedido fica vazio. **Não** vínculo por item de pedido e **não** escolha de pedido pelo ALMOX na preparação. O pedido é gravado na volta. |
| **`ExpedicaoIbc`** | Registro do fechamento da expedição quando a quantidade vinculada é a soma dos pedidos elegíveis; IBCs alocados passam a **Em viagem**; alocações ficam imutáveis e ainda sem pedido. |

### Regras de negócio

1. **Fechar carga** exige caminhão ativo (`Trucks`); sem `CargaDespacho` → rejeita. **v1:** `User` MOTORISTA **não** é obrigatório (decisão triage 2026-09-04 / epic #31 set/2026; implementação: #89). Código legado ainda pode exigir motorista até #89.
2. **Preparação** só em carga `FECHADA` com **Foto de pedidos IBC**. A tela é uma lista da carga: containers vinculados contra o total esperado. Não há card por pedido.
3. **Fechar expedição** só quando a quantidade vinculada à carga é **igual** à soma das quantidades esperadas dos pedidos elegíveis. Diferente, recusa.
4. **Qtd esperada por pedido** = soma no backend de `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM` nas linhas com `CODIGO_EMBALAGEM = 251001`. O split `quantidadeEsperadaVenda` (INCLUSO=S) e `quantidadeEsperadaEmprestimo` (resto) serve para saber se o pedido é elegível e, na volta, para derivar a modalidade. A alocação e o Fechar expedição usam a **soma dos pedidos elegíveis**, não a cota de cada pedido.
5. Pedidos **sem** linha IBC: **não entram** na soma nem no relatório.
6. Cargas **sem pedidos IBC**: não aparecem na lista de expedição.
7. **Bloqueios no vínculo**: Inapto, Em viagem, no cliente, entrada pendente, substituído, já vinculado a outra carga, carga aberta, carga sem foto, acima do total da carga.
8. **Desvincular** permitido antes de `ExpedicaoIbc`; após fechamento, imutável.
9. **Desktop**: digitação manual do código; **web**: scan QR. Nos dois casos o identificador entra na carga, sem pedido.
10. **v1: sem reabrir carga** — alocações não revertem por reabertura.
11. Atribuição container→pedido **não** acontece na preparação. O motorista marca o **Relatório de Viagem** no papel (um bloco por pedido, badge Incluso só no bloco incluso, sem rótulo de empréstimo ou transbordo, nada pré-marcado). O vínculo no sistema nasce na volta (#374).
12. **Pedido IBC inválido** (volume ≤ 0 ou divisão não inteira em linha 251001): fora da soma, com alerta ao ALMOX; demais pedidos da carga seguem.
13. **Pedido misto** (cota de incluso e cota de empréstimo no mesmo pedido): recusado para esta conta. Fica fora do total, não é pedido elegível na volta e **não derruba** o resto da carga.
14. **INCLUSO**: só em 251001; `"S"` → Incluso (venda derivada na volta); qualquer outro → Empréstimo. A modalidade **não** é escolhida na saída. Troca **não** é modalidade de saída.
15. **Volta**: o ALMOX aponta o pedido em ficou e em troca. Pedido só incluso deriva venda: baixa no pool, sem prazo e sem aviso. Pedido só empréstimo deriva empréstimo: fica no cliente, **90 dias** e aviso. Retornou não tem pedido. Quantidade apontada (ficou + troca) diferente da esperada naquele pedido só fecha com confirmação explícita da divergência.

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

Aviso em Venda está decidido na epic #374: incluso não gera aviso; empréstimo gera aviso com 90 dias. Seguem estacionados: scan fora da carga, reabrir carga.

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
| **Lote (compra)** | UI: Entrada → N novos → `dataLimite` única do lote → **NF opcional** (rastro no WP) → gera N identificadores. Defaults iguais ao cadastro unitário: `Aquisição=COMPRA`, `tipoCadastro=NOVO`, `custodia=PATIO`, Apto com alerta **Sem inspeção** (`primeiraInspecaoEm` nulo; não bloqueia alocação — #271). |
| **Unitário** | Continua (#32). |
| **Troca** | **Sem lote.** Na volta (#38): X vazios para cadastrar; cada `#in` vinculado 1:1 a um `#out` pendente daquele cliente/viagem. |
| **Estoque legado no pátio** | Serializar com um ou mais **lotes de compra** (mesmo sem NF histórica no fluxo). |

### Aviso no lote (não bloqueio)

Ao criar N: se `(IBCs vivos WP + N) > saldo ERP(251001)` → **avisa e deixa salvar**.

**Vivos WP** = `baixadoEm IS NULL` e ainda no pool da empresa: pátio + em viagem + no cliente (empréstimo). **Fora:** baixados; **venda já baixada no pool WP**; outbound de troca já substituído.

### Baixa por venda no pool WorkaPool

**Não** no Fechar expedição.

No **retorno do caminhão**, o ALMOX transcreve o Relatório de Viagem e **aponta o pedido** — é nesse momento que o vínculo container↔pedido nasce (**Fechar Viagem**, #38, corrigido pela epic #374). A modalidade sai do pedido, não de uma escolha na saída. Pedido incluso sofre **baixa no estoque/pool do WorkaPool** (sai dos vivos), sem prazo e sem aviso. Empréstimo que ficou permanece vivo (Custódia no Cliente), com prazo de **90 dias** e aviso ao representante. Pedido misto fica fora dessa conta e não derruba o resto da carga. Troca: `#out` sai do pool cobrável; `#in` entra como ativo novo.

### Conciliação por buckets

**Fora** da fatia do lote/cadastro. Depois que Empréstimo / Venda / Troca existirem de verdade (#38+): tela ERP vs WP por buckets (pátio, viagem, cliente, vendidos, troca, baixados, NF sem serializar / serial sem NF).

### Issues

- Epic: [#31](https://github.com/Gabr1elaugus700/WorkaPool/issues/31)
- Cadastro unitário: [#32](https://github.com/Gabr1elaugus700/WorkaPool/issues/32)
- Cadastro em lote + aviso: [#117](https://github.com/Gabr1elaugus700/WorkaPool/issues/117)
- Seam saldo ERP `251001`: [#118](https://github.com/Gabr1elaugus700/WorkaPool/issues/118)
- Fechar Viagem / baixa por venda / Troca 1:1: [#38](https://github.com/Gabr1elaugus700/WorkaPool/issues/38)
- Conciliação buckets (P2): [#119](https://github.com/Gabr1elaugus700/WorkaPool/issues/119)
