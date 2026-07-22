# IBC — Context (decisões de grilling)

Decisões de produto já fechadas. Não reabrir sem novo grill.

## Locked

1. IBC = ativo serializado (número + QR); estoque é projeção
2. Foco = **container**; **não** modelar validade/shelf life do produto neste módulo
3. **Código de embalagem** (ex. 251004) identifica Pedido com IBC; **Volume** (item) = quantidade esperada — campos **distintos**
4. Modalidades: Transbordo, Empréstimo, Venda (Embalagem inclusa), Troca 1:1
5. Fluxo: Alocação Carga → Em viagem → Custódia por Pedido (motorista) → Entrada mista no pátio
6. Troca: Pendentes de retorno da viagem; `#out → #in`; Aquisição compra|troca; outbound sai do pool
7. Inspeção obrigatória no cadastro e em **toda** Entrada; nasce/reentra Aguardando inspeção
8. Score por fator do **catálogo de checklist** (cadastrável) + regra híbrida; alertas Inapto na tela do módulo
9. Prazo Empréstimo padrão 30 dias (v1)
10. Aviso ao Representante in-app pós-viagem quando IBC ficou no Cliente
11. Role **MOTORISTA** no Identity (Prisma `Role`) para descarga / Custódia no Cliente

## Agent discretion (implementação)

- Thresholds numéricos exatos do score
- Formato do identificador (ex. `H030`) e payload do QR
- Copy exata das telas
