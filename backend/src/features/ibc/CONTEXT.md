# IBC

Track physical IBC containers as identifiable assets across custody, commercial modality, quality, and return obligations — not as anonymous stock quantity. Focus is the **container**, not product shelf life.

## Language

**IBC**:
A physical intermediate bulk container treated as a uniquely identified asset (identifier number + QR). Stock counts are projections over IBCs, not the source of truth.
_Avoid_: Estoque (as if quantity alone answered custody/quality), Container genérico sem identidade, validade do produto químico (out of this context)

**Data limite de uso**:
The last date this IBC asset may still be used in circulation. Property of the IBC itself.
_Avoid_: Validade (alone), prazo de devolução, shelf life do produto

**Embalagem IBC (Sapiens)**:
ERP field `EMBALAGEM` on the Pedido item line. Value **251001** identifies IBC packaging on that line. Used to detect which pedidos/lines need containers. Distinct from `QUANTIDADE_EMBALAGEM`.
_Avoid_: Volume (generic), treating packaging code as a quantity, legacy code 251004

**QUANTIDADE_EMBALAGEM (Sapiens)**:
Numeric field on the Pedido item line: expected number of IBC containers for that line. At expedition preparation, **per pedido** expected total = sum of this field across all lines with `EMBALAGEM = 251001`.
_Avoid_: Embalagem code, conflating with product quantity in liters/weight

**CargaDespacho**:
Intermediate record when logistics **closes a Carga**: links the cargo to one driver (`User` with role `MOTORISTA`) and one truck (`Trucks`). Mandatory at close; 1:1 per cargo. Audit: who closed, when.
_Avoid_: Caminhao (deprecated freight table), closing cargo without driver/truck, multiple dispatches per cargo in v1

**AlocacaoIbc**:
Link between an IBC and a **Pedido** (`numPed`) within a Carga during yard preparation. Not item-level — if a pedido has multiple IBC lines, only the **total** container count matters at this stage. Mutable until `ExpedicaoIbc`; immutable after.
_Avoid_: item-level allocation, treating allocation as confirmed customer custody, linking Inapto or in-transit IBCs

**ExpedicaoIbc**:
The act of **closing expedition** after preparation: all IBC-eligible pedidos on a FECHADA cargo have met expected quantities. Creates audit record; moves allocated IBCs to **Em viagem**; locks `AlocacaoIbc` records.
_Avoid_: "Saída da empresa" (use Fechar expedição), closing expedition on ABERTA cargo, LancamentoIbc (deprecated name)

**Transbordo**:
Unload the product at the customer and bring **the same** company IBC back. Custody at the customer is momentary; the asset identity does not change hands.
_Avoid_: Troca, Empréstimo, “devolver um vazio” when you mean the same numbered IBC

**Troca de IBC**:
Ownership swap recorded **1:1** by the patio on return: e.g. **#H030 was exchanged for #H067**. The inbound unit (no company QR yet) is cadastrado with a new identifier + QR, Aquisição = troca, and explicitly linked to the outbound IBC it replaces. The same trip may mix modalities (e.g. 5 Troca + 2 Transbordo); the operator classifies each returning unit.
_Avoid_: Transbordo, lot-only counting without #out↔#in link, treating every empty on the truck as the same modality

**Empréstimo**:
Prolonged custody of the **same** company IBC at the Cliente, with an obligation to return that same identifier and an expected return date. This is what feeds “who didn’t return”; Transbordo does not.
_Avoid_: Transbordo, Troca de IBC, Venda

**Venda**:
Definitive transfer of IBC ownership to the Cliente; the asset leaves the company pool with no return obligation. If the packaging must come back, that is Empréstimo in this context — even when the chemical on the Pedido was sold.
_Avoid_: Empréstimo, calling a returnable IBC a “venda” inside this module

**Inspeção de IBC**:
A recorded quality check of an IBC. The operator scores every **active** checklist item from the quality POP catalog; each score is stored linked to that item. Yields aptidão and condition history.
_Avoid_: treating “qualidade” as a single vague field with no checklist, hardcoding factors only in UI without a catalog table

**Item de checklist**:
A cadastrable quality POP factor/question (fator, ensaio, whether critical, order, active). New inspections load all active items; deactivated items stay on historical respostas only.
_Avoid_: embedding checklist only as code constants with no admin cadastro

**Aptidão**:
Whether the IBC may be used in circulation right now: **Apto** or **Inapto**. Inapto must surface as an alert in the IBC module (identifier visible, with reason).
_Avoid_: “qualidade” alone, hiding inaptidão only inside a detail screen

**Score do fator**:
Numeric score given to one **Item de checklist** in an Inspeção de IBC (stored as IbcInspecaoResposta). Critical items (`critico`) have a hard minimum; others feed an overall average. Scale TBD (0–5 stars discussed; locked context still has 0–10 until camada 1 grill closes).
_Avoid_: binary aprovado/reprovado as the primary checklist result, a single score with no per-item breakdown, scores without FK to the catalog

**Inapto por data limite**:
Automatic Inapto when Data limite de uso is reached or exceeded, regardless of the latest inspection scores.
_Avoid_: treating expiry as only an informational note while still allowing circulation

**Prazo de devolução**:
Expected return date for an Empréstimo. Starting policy: default **30 days** from outbound movement (house maximum for now). Empréstimo cannot be recorded without an expected return date.
_Avoid_: Data limite de uso, leaving Empréstimo open-ended with no expected return

**Preparação de expedição**:
ALMOX links Apto IBCs to pedidos on a Carga. Allowed while cargo is **ABERTA** (partial progress) or **FECHADA**. Physical placement on the truck does not determine which client gets which numbered IBC — the system tracks counts per pedido for control; driver confirms at unload.
_Avoid_: item-level linking, assuming patio knows which # goes to which client, Custódia no Cliente

**Em viagem**:
IBC custody state after **ExpedicaoIbc** is closed and before delivery confirmation or return entry. The asset is on the truck, not in the yard and not yet confirmed at a Cliente.
_Avoid_: No Cliente, Em estoque / no pátio, Situação da Carga

**Custódia no Cliente**:
Confirmed at unload per **Pedido**, not only per Cliente. Driver opens the Cliente stop, sees only Pedidos on that Carga that use IBC packaging (`EMBALAGEM = 251001`), and for each Pedido scans/registers the IBCs that remain there, then saves (e.g. 3 IBCs for Pedido 1120, then 2 for Pedido 1121). Non-IBC Pedidos for the same Cliente are hidden. Records IBC + date + Cliente + Pedido.
_Avoid_: AlocacaoIbc, Em viagem, dumping all of a Cliente’s IBCs without Pedido split when multiple IBC Pedidos exist

**Entrada no pátio**:
Return processing after the trip: the operator gives entry to what came back. Known QR → back to yard custody (Transbordo or Empréstimo devolvido). Unknown unit → cadastro + vínculo 1:1 de Troca de IBC to the outbound identifier (e.g. #H030 → #H067). Every entry puts the IBC in Aguardando inspeção.
_Avoid_: Custódia no Cliente, assuming all returns are the same modality

**Pedido com IBC**:
A Pedido with at least one item line where `EMBALAGEM = 251001`. Only these appear on the driver’s unload screen for that Cliente and on ALMOX expedition preparation.
_Avoid_: showing every Pedido of the Cliente on the IBC unload screen, using product quantity to detect packaging type

**Quantidade esperada de IBC**:
How many IBCs a Pedido com IBC should involve on this trip — `SUM(QUANTIDADE_EMBALAGEM)` across IBC lines. Shown during preparation and to the driver as the target (e.g. “esperado: 3”).
_Avoid_: inventing the count only in the operator’s head, reading quantity from the embalagem code

**Quantidade realizada de IBC**:
How many IBCs were actually confirmed at unload for that Pedido (QR scans saved). Compared with Quantidade esperada for gaps and for post-trip Aviso ao Representante.
_Avoid_: treating AlocacaoIbc counts as Custódia no Cliente

**Embalagem inclusa**:
Pedido/commercial flag that the IBC packaging is sold with the product. When true, IBCs left at the Cliente are **Venda** (no return obligation). When false, IBCs left at the Cliente are **Empréstimo** (Prazo de devolução applies). Inferred from the Pedido — not chosen by the driver at scan time.
_Avoid_: asking the driver to pick Venda vs Empréstimo on every unload

**Aquisição do IBC**:
How this asset entered the company pool: **compra** or **troca**. Set at cadastro. Inbound units that arrive without QR after a trip are registered by the patio operator as new IBCs with Aquisição = troca (Troca de IBC), not treated as anonymous stock.
_Avoid_: leaving pool origin blank, calling every inbound empty an Empréstimo return of a known IBC

**Pendente de retorno**:
An IBC from this Carga/trip that was confirmed in Custódia no Cliente and has not returned with a company QR. Default pick-list when linking a Troca de IBC (#out → #in). Older Empréstimos at the same Cliente are a secondary path, not the default.
_Avoid_: free search across the whole pool as the primary Troca UI, linking a return to an IBC still in the yard

**Aguardando inspeção**:
Aptidão state in which the IBC is **Inapto** until an operator completes Inspeção (checklist + score) on the aptidão screen. Applies on every cadastro and on **every Entrada no pátio** (Transbordo, Empréstimo devolvido, Troca) — no reuse / Preparação de expedição until Apto. Outbound IBC replaced in a Troca de IBC leaves the company pool.
_Avoid_: putting a never-inspected or just-returned IBC Em viagem, treating Troca inbound as Apto by default, skipping verification on “known good” returns

**Aviso ao Representante**:
Operational notice to the Pedido’s Representante when, after the trip return, containers for that Pedido remained with the Cliente (did not return on the truck). Raised in the return/closing flow (operator-involved), not a vague generic alert.
_Avoid_: Inapto alert (quality/expiry), treating this as only a stock count
