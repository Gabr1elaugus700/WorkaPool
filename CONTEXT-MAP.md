# Context Map

WorkaPool is a monolith with multiple bounded contexts. Pedidos is a shared kernel consumed by Cargo and Order Loss — not a public product surface of its own.

## Contexts

- [Pedidos](./backend/src/features/pedidos/CONTEXT.md) — shared kernel: pedido ERP as the common commercial fact
- [Cargo](./backend/src/features/cargo/CONTEXT.md) — assemble and close truck loads (cargas) from pedidos
- [Order Loss](./backend/src/features/orderLoss/CONTEXT.md) — track negotiation and record lost sales with justification
- [Ordem de Serviço](./backend/src/features/workOrder/CONTEXT.md) — facility work orders and inspections
- [Metas](./backend/src/features/goals/CONTEXT.md) — sales targets by rep and product
- [Identity](./backend/src/features/users/CONTEXT.md) — app users, roles, and sales-rep linkage
- [IBC](./backend/src/features/ibc/CONTEXT.md) — physical IBC assets: identity, aptidão, custody, return obligation

## Discontinued

- **Frete (cálculo)** — route/truck freight cost estimation was discontinued. “Frete” in live language means only a Motivo de Perda.

## Relationships

- **Pedidos → Cargo**: Cargo reads Pedidos Fechados and allocates them into cargas
- **Pedidos → Order Loss**: Order Loss reads pedidos do ERP and tracks negotiation / perda
- **Identity → Cargo / Order Loss / Metas**: User.role and User.codRep scope who sees and changes what
- **Identity → Ordem de Serviço**: Departamento and Role gate facility tickets
- **Pedidos → IBC**: IBC reads `CODIGO_EMBALAGEM` (251001), `VOLUME_EMBALAGEM`, `QUANTIDADE_PEDIDO`, `INCLUSO`, Cliente, and Representante from the Pedido (via pedidos-by-carga); computes expected counts in backend; it does not own Pedido
- **Cargo → IBC**: `CargaDespacho` on cargo close (driver + truck); `AlocacaoIbc` links IBCs to Pedidos during preparation; `ExpedicaoIbc` closes expedition and moves IBC custody to Em viagem
- **Identity → IBC**: MOTORISTA (dispatch + unload / Custódia no Cliente); ALMOX (preparação + Fechar expedição); LOGISTICA (Fechar Carga + CargaDespacho); VENDAS (avisos do próprio Representante)

## Explicit non-relationships

- **Pedido perdido ≠ Pedido ≠ Ordem de Serviço** — three different ideas; never treat them as synonyms
- **Carga FECHADA ≠ Pedido Fechado** — closing a Carga is not the same “fechado” as a Pedido ready for loading
- **Em viagem ≠ Situação da Carga** — Em viagem is IBC custody on the truck; Cargo still must not call a Carga a “viagem”
- **Inspeção de IBC ≠ Vistoria / Checklist de OS** — IBC has its own quality catalog (score 0–10); facility checklists stay in Ordem de Serviço
- **AlocacaoIbc ≠ Custódia no Cliente** — planned pedido-level count at yard vs driver-confirmed location at unload
- **ExpedicaoIbc ≠ Fechar Carga** — logistics closes the load; ALMOX closes IBC expedition afterward
- **Aquisição troca ≠ devolução de Empréstimo** — inbound without QR is a new asset linked 1:1, not the return of the same identifier
- **Transbordo ≠ Troca de IBC** — same trip can mix both; operator classifies each returning unit

