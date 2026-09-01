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
| **LOGISTICA** | Fecha a Carga (`FECHADA`) com **`CargaDespacho`** obrigatório |
| **ALMOX** | Prepara vínculos IBC↔Pedido; **Fechar expedição** (`ExpedicaoIbc`) |
| **MOTORISTA** | Vinculado no fechamento da carga (User role `MOTORISTA`) |

### Entidades

| Entidade | Propósito |
|----------|-----------|
| **`CargaDespacho`** | Tabela intermediária: carga + motorista + caminhão (`Trucks`) + auditoria. 1:1 por carga. `Caminhao` (fretes) é **depreciado** — usar `Trucks`. |
| **`AlocacaoIbc`** | Vínculo IBC ↔ **Pedido** (`numPed`) dentro de uma carga. **Não** vínculo por item de pedido. |
| **`ExpedicaoIbc`** | Registro do fechamento da expedição; IBCs alocados passam a **Em viagem**; alocações ficam imutáveis. |

### Regras de negócio

1. **Fechar carga** exige motorista + caminhão; sem `CargaDespacho` → rejeita.
2. **Preparação** pode começar em carga `ABERTA` (progresso parcial visível, ex. "2/3 IBCs").
3. **Fechar expedição** só quando carga `FECHADA` + cada pedido com IBC tem qtd vinculada = qtd esperada.
4. **Qtd esperada por pedido** = soma no backend de `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM` nas linhas com `CODIGO_EMBALAGEM = 251001`. Expor também split `quantidadeEsperadaVenda` (INCLUSO=S) e `quantidadeEsperadaEmprestimo` (resto). Alocação / Fechar expedição usam o **total** nesta fatia.
5. Pedidos **sem** linha IBC: **não aparecem** na tela de alocação.
6. Cargas **sem pedidos IBC**: aparecem na lista com indicador visual, **sem ações**.
7. **Bloqueios no vínculo**: Inapto, Em viagem, já vinculado a outra carga, excede limite do pedido.
8. **Desvincular** permitido antes de `ExpedicaoIbc`; após fechamento, imutável.
9. **Desktop**: digitação manual do código; **web**: scan QR.
10. **v1: sem reabrir carga** — alocações não revertem por reabertura.
11. Atribuição física container→cliente **não** acontece na preparação (mesmo que o sistema registre por pedido para controle de qtd); motorista confirma na descarga (#37).
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

**Fora destas camadas**: custódia motorista (#37), entrada/troca (#38), aviso representante (#39), ficha QR (#40), empréstimos atrasados (#41)

Perguntas estacionadas até camada de viagem: aviso em Venda, scan fora da carga, reabrir carga.
