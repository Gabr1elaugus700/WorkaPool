# Order Loss

Track commercial negotiation on a Pedido and record when that negotiation is lost — always with a Motivo de Perda.

## Language

**Negociação**:
The commercial follow-up of a Pedido in the app (em negociação → ganho / perdido / cancelado). Identified by the Pedido number.
_Avoid_: Pedido (the ERP order alone), Ordem de Serviço, Carga, Order (English code name in speech)

**Status da Negociação**:
NEGOTIATING (em negociação), LOST (perdido), WON (ganho), CANCELLED (cancelado).
_Avoid_: Situação da Carga, sitped, sitcar

**Pedido perdido**:
A Pedido whose negotiation was lost and therefore requires a Motivo de Perda. Same idea in speech: **venda perdida**, **negociação perdida**.
_Avoid_: Pedido Fechado, Carga Fechada, treating “perdido” as only an ERP flag without the justification

**Motivo de Perda**:
Required justification when a Negociação is marked lost: frete, preço, margem, estoque, ou outro.
_Avoid_: Motivo genérico sem código

**Frete**:
Here, only a Motivo de Perda code (loss attributed to freight cost). The old frete cost-calculation feature is discontinued.
_Avoid_: cálculo de frete, rota base, caminhão (catálogo descontinuado)
