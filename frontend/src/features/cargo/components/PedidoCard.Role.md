# PedidoCard Role

## Objetivo
Documentar onde o componente `PedidoCard` aparece, para quem ele aparece, quais regras de visualizacao/personalizacao sao aplicadas e quais dados sao exibidos em cada contexto.

## Onde o `PedidoCard` aparece

1. Em `PedidosSection` (`pedidos` soltos, fora de carga)
- Arquivo: `frontend/src/features/cargo/components/PedidosSection.tsx`
- Renderiza um `PedidoCard` para cada item de `pedidos`.

2. Em `CargasSection` (dentro de cada `CargaDropzone`)
- Arquivo: `frontend/src/features/cargo/components/CargasSection.tsx`
- Para cada carga, renderiza os pedidos da carga ordenados por `poscar`.
- O card aparece como `children` do `CargaDropzone`.

## Regras de exibicao por contexto

### 1) `PedidosSection` (fora da carga)

- Regra de visibilidade da secao:
  - Se `userRole === "ALMOX"`, a secao inteira retorna `null` e nenhum `PedidoCard` aparece.
  - Para os demais roles, os cards aparecem normalmente.
- Props enviadas ao `PedidoCard`:
  - `viewMode="full"` (enviado, mas atualmente nao altera o render interno do card).
  - `isDraggable={true}`.
  - `compact={false}` (valor padrao, pois nao e enviado explicitamente).
  - `codRepUsuarioLogado={codRepUsuarioLogado || 999}`.

### 2) Dentro de `CargaDropzone` (via `CargasSection`)

- O `CargaDropzone` apenas recebe e exibe os cards como `children`.
- A decisao de como cada card e exibido ocorre em `CargasSection` + `PedidoCard`.
- Props enviadas ao `PedidoCard` nesse contexto:
  - `viewMode={getPedidoViewMode(userRole, codRepUsuarioLogado, pedido.codRep)}`.
  - `isDraggable={viewMode === "full"}`.
  - `compact={true}`.
  - `codRepUsuarioLogado={codRepUsuarioLogado || 999}`.

## Regras internas de visualizacao no `PedidoCard`

Arquivo: `frontend/src/features/cargo/components/PedidoCard.tsx`

### 1) Permissao de detalhe (regra efetiva atual)

O card usa a funcao interna:
- `canViewPedidoCompleto(codRepUsuarioLogado, codRepPedido)`

Retorna `true` somente quando:
- `codRepUsuarioLogado === 999` (admin tecnico), ou
- `codRepUsuarioLogado === codRepPedido`.

Com isso:
- `isOther = !canViewFullData`
- Se `isOther` for `true`, o card mostra visual reduzido.
- Se `isOther` for `false`, mostra visual completo.

Importante:
- O `viewMode` recebido por prop nao esta sendo aplicado no render atual.
- Existe comentario no codigo sugerindo como usar `viewMode`, mas a linha ativa ignora essa prop.

### 2) Arraste (drag-and-drop)

- `effectivelyDraggable = isDraggable && (!isBlocked || canDragBlocked)`
- `isBlocked = pedido.bloqueado === "S"`
- Pedido bloqueado so pode ser arrastado se `canViewFullData === true` (mesmo vendedor ou admin 999).

### 3) Status visual

- `mine`: `border-green-400 bg-green-50` e header verde.
- `other`: `border-slate-900 bg-slate-50` e header escuro.
- `blocked`: `border-red-400 bg-red-50` e header vermelho.

Prioridade:
1. bloqueado (`blocked`)
2. sem permissao de detalhe (`other`)
3. caso contrario (`mine`)

## Quais valores o card mostra

### A) Quando `isOther === true` (resumo)

Header:
- `pedido.cidade`
- Nao mostra `numPed`.

Corpo:
- `pedido.vendedor`
- `pedido.peso` formatado
- Icones de usuario e peso.

Nao mostra:
- `cliente`
- lista de produtos
- derivacao/peso por produto

### B) Quando `isOther === false` (completo)

Header:
- `pedido.cidade - pedido.numPed`

Corpo:
- `pedido.cliente`
- `pedido.vendedor`
- `pedido.peso` total formatado
- produtos (somente se `compact === false`):
  - `prod.nome`
  - `prod.derivacao`
  - `prod.peso` formatado

Quando `compact === true` (caso dentro de carga):
- oculta o bloco detalhado de produtos, mesmo no modo completo.

## Matriz resumida de comportamento

1. Fora de carga (`PedidosSection`)
- Roles visiveis: todos, exceto `ALMOX`.
- Arraste: habilitado por prop, mas bloqueados continuam restritos pela regra interna.
- Nivel de detalhe final: depende de `codRepUsuarioLogado` vs `pedido.codRep` (ou admin 999), nao de `viewMode`.
- Produtos: podem aparecer (compact padrao `false`).

2. Dentro de carga (`CargaDropzone` via `CargasSection`)
- Card sempre aparece para pedidos ja dentro da carga listada.
- Arraste: definido por `viewMode === "full"` em `CargasSection`, com restricao adicional para bloqueados no `PedidoCard`.
- Nivel de detalhe final: tambem depende de `codRepUsuarioLogado` vs `pedido.codRep` (ou 999), pois `viewMode` nao e aplicado no render interno.
- Produtos: nao aparecem (`compact={true}`).

## Pontos de validacao recomendados

1. Confirmar se a regra oficial deve ser por `role` (`canViewPedido`) ou por `codRep` (`canViewPedidoCompleto` atual do card).
2. Confirmar se `viewMode` deve controlar o layout (hoje nao controla, apesar de ser enviado).
3. Confirmar se `ALMOX` realmente nao deve ver pedidos soltos, mas pode ver pedidos dentro de carga.
4. Confirmar se o fallback `codRepUsuarioLogado || 999` e desejado para todos os cenarios.
