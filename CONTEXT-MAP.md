# Context Map

WorkaPool is a monolith with multiple bounded contexts. Pedidos is a shared kernel consumed by Cargo and Order Loss — not a public product surface of its own.

## Contexts

- [Pedidos](./backend/src/features/pedidos/CONTEXT.md) — shared kernel: pedido ERP as the common commercial fact
- [Cargo](./backend/src/features/cargo/CONTEXT.md) — assemble and close truck loads (cargas) from pedidos
- [Order Loss](./backend/src/features/orderLoss/CONTEXT.md) — track negotiation and record lost sales with justification
- [Ordem de Serviço](./backend/src/features/workOrder/CONTEXT.md) — facility work orders and inspections
- [Metas](./backend/src/features/goals/CONTEXT.md) — sales targets by rep and product
- [Identity](./backend/src/features/users/CONTEXT.md) — app users, roles, and sales-rep linkage
- [IBC](./backend/src/features/ibc/CONTEXT.md) — IBC assets: custódia, modalidades, inspeção a cada entrada, troca 1:1 (container only)


## Discontinued

- **Frete (cálculo)** — route/truck freight cost estimation was discontinued. “Frete” in live language means only a Motivo de Perda.

## Relationships

- **Pedidos → Cargo**: Cargo reads Pedidos Fechados and allocates them into cargas
- **Pedidos → Order Loss**: Order Loss reads pedidos do ERP and tracks negotiation / perda
- **Identity → Cargo / Order Loss / Metas**: User.role and User.codRep scope who sees and changes what
- **Identity → Ordem de Serviço**: Departamento and Role gate facility tickets
- **Cargo → IBC** (emerging): patio Alocação na Carga puts IBCs Em viagem; driver scan establishes Custódia no Cliente; Entrada no pátio returns units on the truck
- **Pedidos → IBC** (emerging): unload confirms Custódia no Cliente per Pedido com IBC; Aviso ao Representante uses the Pedido’s Representante
- **Identity → IBC** (emerging): Representante receives Aviso when IBCs stay at Cliente after trip return

## Explicit non-relationships

- **Pedido perdido ≠ Pedido ≠ Ordem de Serviço** — three different ideas; never treat them as synonyms
- **Carga FECHADA ≠ Pedido Fechado** — closing a Carga is not the same “fechado” as a Pedido ready for loading
- **Em viagem ≠ Custódia no Cliente** — allocated on the truck is not yet confirmed at the customer
- **Aquisição troca ≠ devolução de Empréstimo** — inbound without QR is a new asset linked 1:1 to an outbound IBC, not the return of the same identifier
- **Pendente de retorno ≠ Em viagem** — pending return is after Custódia no Cliente; Em viagem is still on the truck before unload confirmation
- **Entrada no pátio ≠ Apto** — every return re-enters Aguardando inspeção; verification is mandatory before the next trip
