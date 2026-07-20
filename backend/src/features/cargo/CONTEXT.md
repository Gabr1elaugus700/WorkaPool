# Cargo

Assemble truck loads from Pedidos Fechados, keep weight coherent, and close the load when shipping is ready.

## Language

**Carga**:
A load being assembled for a destination: max weight, departure forecast, and a situation lifecycle. Identified by codCar. Pedidos are allocated into it.
_Avoid_: Viagem, Ordem, Pedido, Rota

**codCar**:
The business number of a Carga. What people mean when they say “carga 1234”.
_Avoid_: id interno da carga

**Situação da Carga**:
Lifecycle of the load: ABERTA → SOLICITADA → FECHADA, or CANCELADA / ENTREGUE.
_Avoid_: sitped, sitcar, status de Negociação

**Fechar Carga**:
Finalize an open load after each allocated Pedido has a valid shipping entry in Sapiens; produces a snapshot of what went on the load.
_Avoid_: “fechar pedido” when you mean marking a Pedido Fechado; confusing with Pedido Fechado

**Carga Fechada**:
The frozen snapshot of pedidos that were on a Carga at close time.
_Avoid_: Pedido Fechado

**Pedido Fechado**:
A Pedido eligible to be integrated into a Carga. May already be on a Carga or still solto.
_Avoid_: Carga Fechada, Pedido perdido, Pedido aberto (ambiguous)

**Pedido solto**:
A Pedido Fechado not yet allocated to any Carga (no codCar).
_Avoid_: Pedido aberto, Pedido sem carga (when you mean a different ERP situation)

**posCar**:
The position of a Pedido inside its Carga.
_Avoid_: ordem de serviço, prioridade de OS

**sitcar**:
ERP field for the Pedido’s situation *inside* a Carga. Distinct from Situação da Carga and from sitped.
_Avoid_: Situação da Carga, Situação do Pedido

**Histórico de Peso**:
Record of a Pedido’s weight while it belongs to cargas; used to detect weight changes that threaten load integrity.
_Avoid_: Motivo de Perda Frete

**Watchdog**:
Background process that rechecks weights on open cargas and may remove or reposition pedidos. Operational mechanism, not a domain entity people talk about as cargo.
_Avoid_: treating Watchdog as a kind of Carga or Pedido
