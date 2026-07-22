# Pedidos

Shared kernel for sales orders that live in Sapiens. Cargo and Order Loss each extend this language for their own needs; neither owns the Pedido.

## Language

**Pedido**:
A sales order in Sapiens, identified by its number (numPed). The commercial fact shared across contexts. Not automatically copied into the app database.
_Avoid_: Order (Order Loss aggregate), Ordem de Servi?o, Carga

**Cliente**:
The buyer on a Pedido (from Sapiens). Display and filter identity, not a rich local aggregate.
_Avoid_: Empresa, User, Conta

**Representante**:
The sales rep responsible for a Pedido, identified by codRep. Links app Users to ERP sales scope.
_Avoid_: User (as if they were the same), Vendedor when you mean the app login account

**Situa??o do Pedido (sitped)**:
ERP code for where the Pedido sits in the commercial pipeline. Meaning is context-specific: the same code is not ?open? or ?closed? in everyday Portuguese without naming the context.
_Avoid_: Situa??o da Carga, sitcar, status do Acompanhamento

**Pedido Fechado**:
In Cargo speech: a Pedido eligible to join a Carga. See Cargo context.
_Avoid_: Carga Fechada

**Pedido perdido**:
In Order Loss speech: a Pedido whose negotiation was lost (also: venda perdida, negocia??o perdida). See Order Loss context.
_Avoid_: Pedido Fechado

**PedidoCargo**:
A Pedido seen through Cargo¢s lens ? weight, allocation to a carga, position in the load.
_Avoid_: Pedido (alone) when cargo-specific fields are in play

**PedidoOrderLoss**:
A Pedido seen through Order Loss¢s lens ? price, margin, freight, taxes for commercial analysis.
_Avoid_: PedidoCargo, Pedido (alone) when loss-analysis fields are in play

**Deriva??o**:
ERP packaging/derivation code of a product line on a Pedido. Used by other contexts to interpret packaging (e.g. IBC when code is 251004).
_Avoid_: treating Deriva??o as the IBC asset itself
