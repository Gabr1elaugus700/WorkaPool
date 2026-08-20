# Ubiquitous Language

Domain language for **IBC expedition** (Fechar Carga → Em viagem) and the adjacent cargo/custody concepts used in issues #36 / #56 and related grilling.

## Assets and identity

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **IBC** | A physical intermediate bulk container treated as a uniquely identified asset (identifier + QR). | Estoque (como verdade), container genérico sem identidade, validade do produto químico |
| **Identificador do IBC** | The human-facing serial of an IBC asset (e.g. H0045). | Código genérico, SKU, “número do estoque” |
| **Aquisição do IBC** | How the asset entered the company pool: **compra** or **troca**. | Origem em branco, tratar toda entrada como Empréstimo |

## Pedido and Sapiens packaging

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Pedido** | A commercial order identified by `numPed`, possibly with one or more item lines. | Item, linha, OS |
| **Embalagem IBC (Sapiens)** | ERP field `EMBALAGEM` on a Pedido line; value **251001** marks that line as needing IBC containers. | Volume, código de quantidade, legado **251004** |
| **QUANTIDADE_EMBALAGEM** | Numeric ERP field on a Pedido line: expected number of IBC containers for that line. | Embalagem (código), quantidade do produto em litros/kg |
| **Pedido com IBC** | A Pedido with at least one line where `EMBALAGEM = 251001`. | Qualquer Pedido do Cliente, Pedido “de volume” |
| **Quantidade esperada de IBC** | Per Pedido: `SUM(QUANTIDADE_EMBALAGEM)` over lines with `EMBALAGEM = 251001`. | Ler quantidade do código 251001, inventar o alvo na cabeça do operador |
| **Quantidade realizada de IBC** | Count of IBCs confirmed at driver unload for that Pedido (Custódia no Cliente). | Contagem de AlocacaoIbc como se fosse custódia no Cliente |

## Carga and dispatch

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Carga** | A truck load being assembled for a destination, identified by **codCar**. | Viagem (como sinônimo de Carga), Ordem, Pedido, Rota |
| **codCar** | The business number of a Carga. | id interno da carga |
| **Situação da Carga** | Lifecycle of the load (e.g. ABERTA, FECHADA). | sitcar, sitped, status de Negociação |
| **Fechar Carga** | Logistics finalizes an open load and **must** create **CargaDespacho**. | Fechar pedido, Fechar expedição |
| **CargaDespacho** | 1:1 dispatch record at Fechar Carga: Carga + User **MOTORISTA** + **Trucks**, with audit of who closed and when. | Caminhao (fretes), despacho inline sem registro, múltiplos motoristas na v1 |
| **Trucks** | Canonical truck entity used for CargaDespacho. | **Caminhao** (tabela de fretes; depreciada para despacho IBC) |

## Expedition (yard → Em viagem)

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Preparação de expedição** | ALMOX links Apto IBCs to Pedidos on a Carga (ABERTA or FECHADA), tracking counts per Pedido. | Custódia no Cliente, vínculo por item de Pedido |
| **AlocacaoIbc** | Mutable link IBC ↔ Pedido (`numPed`) ↔ Carga until ExpedicaoIbc; then immutable. | Alocação por item, LancamentoIbc |
| **ExpedicaoIbc** | The act/record of **Fechar expedição**: all Pedidos com IBC on a FECHADA Carga are fully supplied. | “Saída da empresa”, fechar expedição em Carga ABERTA |
| **Fechar expedição** | ALMOX closes preparation: creates ExpedicaoIbc, moves allocated IBCs to **Em viagem**, locks AlocacaoIbc. | Fechar Carga, confirmar entrega |
| **Em viagem** | Custody state after Fechar expedição and before unload or yard return: IBC is on the truck, not in the yard and not yet at a Cliente. | No Cliente, Em estoque / no pátio, Situação da Carga |

## Aptidão (allocation gates)

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Aptidão** | Whether the IBC may circulate now: **Apto** or **Inapto**. | “Qualidade” vaga, esconder Inapto só na ficha |
| **Apto** | IBC cleared for allocation and circulation. | “Bom”, liberado sem inspeção |
| **Inapto** | IBC blocked from AlocacaoIbc (inspection, data limite, or Aguardando inspeção). | Só aviso informativo sem bloqueio |
| **Aguardando inspeção** | Inapto until Inspeção completes; applies on cadastro and every Entrada no pátio. | Em viagem sem inspeção, Troca inbound já Apto |

## Actors and roles

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **LOGISTICA** | Role that **Fecha Carga** with CargaDespacho. | ALMOX fechando carga |
| **ALMOX** | Role that prepares AlocacaoIbc and **Fecha expedição**. | LOGISTICA alocando IBC |
| **MOTORISTA** | User role linked on CargaDespacho; later confirms Custódia no Cliente (fora desta fatia). | Motorista só como texto livre sem User |

## Modalities (adjacent; not this expedition slice)

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Custódia no Cliente** | Confirmed at unload per Pedido: IBC + date + Cliente + Pedido. | AlocacaoIbc, Em viagem |
| **Transbordo** | Same numbered company IBC returns after momentary customer custody. | Troca, Empréstimo |
| **Troca de IBC** | 1:1 ownership swap recorded on return (`#out → #in`). | Contagem de lotes sem vínculo |
| **Empréstimo** | Prolonged custody of the same IBC at Cliente with Prazo de devolução. | Transbordo, Venda |
| **Venda** | Definitive transfer of IBC ownership to Cliente (no return obligation). | Chamar Empréstimo de venda |

## Relationships

- A **Carga** has at most one **CargaDespacho** (v1, 1:1).
- **Fechar Carga** produces **CargaDespacho**; it does **not** create **ExpedicaoIbc**.
- An **AlocacaoIbc** belongs to exactly one **Carga**, one **Pedido**, and one **IBC**.
- **Quantidade esperada de IBC** is computed per **Pedido** from Sapiens lines; **AlocacaoIbc** count must not exceed it.
- **Fechar expedição** requires **Situação da Carga** = FECHADA and every **Pedido com IBC** fully supplied.
- **Fechar expedição** moves each allocated **IBC** to **Em viagem** and freezes its **AlocacaoIbc**.
- **AlocacaoIbc** is **not** **Custódia no Cliente**; driver unload (#37) establishes that later.
- **EMBALAGEM = 251001** identifies packaging type; **QUANTIDADE_EMBALAGEM** is the expected container count — never conflate them.
- **Trucks** is the truck for **CargaDespacho**; **Caminhao** is freight costing, not IBC dispatch.

## Example dialogue

> **Dev:** "When LOGISTICA closes a **Carga**, do the IBCs go **Em viagem**?"
> **Domain expert:** "No. **Fechar Carga** only creates **CargaDespacho** (motorista + **Trucks**). IBCs stay in the yard until ALMOX **Fecha expedição**."
> **Dev:** "So **AlocacaoIbc** is already customer custody?"
> **Domain expert:** "No. **AlocacaoIbc** is yard preparation by **Pedido**. **Custódia no Cliente** only happens at unload, per **Pedido**."
> **Dev:** "For pedido 1120, is the target the packaging code **251001**?"
> **Domain expert:** "251001 means the line is a **Pedido com IBC**. The target count is **Quantidade esperada de IBC** = sum of **QUANTIDADE_EMBALAGEM** on those lines. Never use 251004 — that was corrected."
> **Dev:** "Can ALMOX close expedition while the **Carga** is still ABERTA if all links are done?"
> **Domain expert:** "No. Preparation can run on ABERTA, but **Fechar expedição** requires FECHADA plus every **Pedido com IBC** fully supplied."

## Flagged ambiguities

- **251004 vs 251001** — Older recovered docs used **251004**. Canonical (Aug 2026) is **251001**. Prefer 251001 everywhere; treat 251004 as legacy only.
- **Embalagem vs QUANTIDADE_EMBALAGEM** — Same conversation risk: packaging *code* vs expected *count*. Keep both terms; never say “Volume” for either without mapping to the ERP field.
- **Fechar Carga vs Fechar expedição** — Different actors and effects. Closing cargo ≠ putting IBCs **Em viagem**.
- **AlocacaoIbc vs Custódia no Cliente** — Allocation is a plan/count at the yard; custody at the customer is confirmed later by the driver.
- **Trucks vs Caminhao** — **Trucks** for **CargaDespacho**; **Caminhao** is the freight/rota domain. Do not reuse **Caminhao** for IBC dispatch.
- **Cliente (customer) vs User** — **Cliente** is the commercial counterparty in custody language; **User** is an authentication identity (roles LOGISTICA, ALMOX, MOTORISTA). Do not call the driver “Cliente”.
- **Viagem** — Colloquial for the physical trip; prefer **Carga** for the load entity and **Em viagem** for the IBC custody state, not “viagem” as a synonym of **Carga**.
- **Inapto / Em viagem / já vinculado** — Three distinct allocation blockers; do not collapse them into a single “não pode vincular”.
