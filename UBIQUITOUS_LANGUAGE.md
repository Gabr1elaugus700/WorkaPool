# Ubiquitous Language

Domain language for **IBC expedition** (Fechar Carga → Em viagem) and adjacent cargo/custody concepts. Updated after Sapiens field grill (ago/2026).

## Assets and identity

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **IBC** | A physical intermediate bulk container treated as a uniquely identified asset (identifier + QR). | Estoque (como verdade), container genérico sem identidade, validade do produto químico |
| **Identificador do IBC** | The human-facing serial of an IBC asset (e.g. H0045). | Código genérico, SKU, “número do estoque” |
| **Aquisição do IBC** | How the asset entered the company pool: **compra** or **troca**. | Origem em branco, tratar toda entrada como Empréstimo |

## Pedido and Sapiens packaging

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Pedido** | A commercial order identified by `numPed`, with one or more item lines. | Item, linha, OS |
| **CODIGO_EMBALAGEM** | ERP field `der.usu_codemb` on a Pedido line; value **251001** marks a container (IBC) line. | `EMBALAGEM` solto, legado **251004**, **QUANTIDADE_EMBALAGEM** (termo aposentado) |
| **VOLUME_EMBALAGEM** | ERP field `der.usu_qtdmve`: packaging volume/capacity used as divisor to derive container count. | Quantidade esperada, código 251001, “Volume” sem mapear ao campo ERP |
| **QUANTIDADE_PEDIDO** | ERP field `ipd.qtdped`: ordered quantity on the line (numerator in the container calculation). | Volume da embalagem, quantidade de containers já calculada |
| **INCLUSO** | ERP field `ipd.usu_embinc` on a **container** line: after trim/upper, `"S"` = sold with product; any other value (incl. null) = not sold. | Embalagem inclusa fora de linha 251001, Troca na saída |
| **Pedido com IBC** | A Pedido with at least one valid container line (`CODIGO_EMBALAGEM = 251001` and a valid container calculation). | Qualquer Pedido do Cliente |
| **Quantidade esperada de IBC** | Backend-only result: per container line `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM`, then **sum** over valid 251001 lines on the Pedido. | Calcular na SQL, **QUANTIDADE_EMBALAGEM**, ler quantidade do código 251001 |
| **Quantidade esperada Venda** | Sum of container counts on lines where **INCLUSO** normalizes to `"S"`. | Misturar com Empréstimo no mesmo contador |
| **Quantidade esperada Empréstimo** | Sum of container counts on 251001 lines where **INCLUSO** is not `"S"`. | Chamar de Troca na saída |
| **Pedido IBC inválido** | A Pedido that has a 251001 line with `VOLUME_EMBALAGEM ≤ 0` or a non-integer division result. | Engolir linha quebrada, arredondar em silêncio |
| **Quantidade realizada de IBC** | Count of IBCs confirmed at driver unload for that Pedido. | Contagem de AlocacaoIbc como custódia no Cliente |

## Carga and dispatch

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Carga** | A truck load being assembled for a destination, identified by **codCar**. | Viagem (como sinônimo de Carga), Ordem, Pedido, Rota |
| **codCar** | The business number of a Carga. | id interno da carga |
| **Situação da Carga** | Lifecycle of the load (e.g. ABERTA, FECHADA). | sitcar, sitped, status de Negociação |
| **Fechar Carga** | Logistics finalizes an open load and **must** create **CargaDespacho**. | Fechar pedido, Fechar expedição |
| **CargaDespacho** | 1:1 dispatch record at Fechar Carga: Carga + User **MOTORISTA** + **Trucks**, with audit of who closed and when. | Caminhao (fretes), despacho inline sem registro |
| **Trucks** | Canonical truck entity used for CargaDespacho. | **Caminhao** (fretes; depreciada para despacho IBC) |

## Expedition (yard → Em viagem)

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Preparação de expedição** | ALMOX links Apto IBCs to Pedidos on a Carga (ABERTA or FECHADA), tracking counts per Pedido. | Custódia no Cliente, vínculo por item |
| **AlocacaoIbc** | Mutable link IBC ↔ Pedido (`numPed`) ↔ Carga until ExpedicaoIbc; then immutable. Cap = **Quantidade esperada de IBC** (total). | Alocação por modalidade Venda/Empréstimo nesta fatia |
| **ExpedicaoIbc** | The act/record of **Fechar expedição** when every Pedido com IBC on a FECHADA Carga is fully supplied on **total**. | “Saída da empresa”, fechar em Carga ABERTA |
| **Fechar expedição** | ALMOX closes preparation: creates ExpedicaoIbc, moves allocated IBCs to **Em viagem**, locks AlocacaoIbc. | Fechar Carga |
| **Em viagem** | Custody after Fechar expedição and before unload or yard return. | No Cliente, Em estoque / no pátio |

## Aptidão (allocation gates)

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Aptidão** | Whether the IBC may circulate now: **Apto** or **Inapto**. | “Qualidade” vaga |
| **Apto** | IBC cleared for allocation and circulation. | “Bom” sem inspeção |
| **Inapto** | IBC blocked from AlocacaoIbc. | Só aviso sem bloqueio |
| **Aguardando inspeção** | Inapto until Inspeção completes. | Em viagem sem inspeção |

## Actors and roles

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **LOGISTICA** | Role that **Fecha Carga** with CargaDespacho. | ALMOX fechando carga |
| **ALMOX** | Role that prepares AlocacaoIbc and **Fecha expedição**; sees alerts for **Pedido IBC inválido**. | LOGISTICA alocando IBC |
| **MOTORISTA** | User role on CargaDespacho; later confirms Custódia no Cliente. | Motorista só como texto livre |

## Modalities

| Term | Definition | Aliases to avoid |
| ---- | ---------- | ---------------- |
| **Custódia no Cliente** | Confirmed at unload per Pedido: IBC + date + Cliente + Pedido. | AlocacaoIbc, Em viagem |
| **Transbordo** | Same numbered company IBC returns after momentary customer custody. | Troca, Empréstimo |
| **Troca de IBC** | 1:1 ownership swap on **return** (`#out → #in`). | Usar Troca como modalidade de saída por INCLUSO=N |
| **Empréstimo** | Prolonged custody of the same IBC at Cliente with Prazo de devolução; outbound when **INCLUSO** ≠ `"S"`. | Transbordo, Venda |
| **Venda** | Definitive transfer of IBC ownership to Cliente; outbound when **INCLUSO** = `"S"`. | Chamar Empréstimo de venda |

## Relationships

- **CODIGO_EMBALAGEM = 251001** identifies a container line; **VOLUME_EMBALAGEM** and **QUANTIDADE_PEDIDO** feed the count — never conflate code with quantity.
- **Quantidade esperada de IBC** = sum of per-line divisions; computed **only in the backend**, only for 251001 lines.
- **INCLUSO** is interpreted **only** on 251001 lines; other packaging codes ignore it.
- A Pedido may expose **Quantidade esperada Venda** and **Quantidade esperada Empréstimo** separately when both exist; total = venda + empréstimo.
- **AlocacaoIbc** and **Fechar expedição** use **Quantidade esperada de IBC** (total) in this slice; the Venda/Empréstimo split is informational until unload / ERP column.
- A **Pedido IBC inválido** blocks allocation/close for that Pedido only; ALMOX receives an alert; other Pedidos on the Carga proceed.
- **Fechar Carga** creates **CargaDespacho**; it does **not** create **ExpedicaoIbc**.
- **AlocacaoIbc** is **not** **Custódia no Cliente**.
- **Troca de IBC** happens at **Entrada no pátio**, not from **INCLUSO = N** at outbound.

## Example dialogue

> **Dev:** "Is expected container count the ERP field QUANTIDADE_EMBALAGEM?"
> **Domain expert:** "That name is retired. Bring **CODIGO_EMBALAGEM**, **VOLUME_EMBALAGEM**, **QUANTIDADE_PEDIDO**, and **INCLUSO**. Count = **QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM** in the backend, only when code is 251001."
> **Dev:** "If the same Pedido has INCLUSO S and N lines, do we pick one modality?"
> **Domain expert:** "No — expose **Quantidade esperada Venda** and **Quantidade esperada Empréstimo** separately. Preparation still allocates against the **total**."
> **Dev:** "So INCLUSO = N means Troca?"
> **Domain expert:** "No. At outbound, N means **Empréstimo**. **Troca** is only on return when an empty without QR replaces an outbound unit."
> **Dev:** "What if VOLUME_EMBALAGEM is zero on one container line?"
> **Domain expert:** "That Pedido is **Pedido IBC inválido** — block IBC actions for it and **alert ALMOX**. Other Pedidos on the Carga stay fine."

## Flagged ambiguities

- **QUANTIDADE_EMBALAGEM** — Invented earlier; **retired**. Use the four ERP fields + backend division.
- **VOLUME_EMBALAGEM vs Quantidade esperada** — Volume is the divisor, not the container count.
- **INCLUSO = N vs Troca** — N at outbound = **Empréstimo**; **Troca** is return-only.
- **Fechar Carga vs Fechar expedição** — Different actors and effects.
- **AlocacaoIbc vs Custódia no Cliente** — Yard plan vs unload truth.
- **Trucks vs Caminhao** — Trucks for CargaDespacho; Caminhao is freight.
- **251004** — Legacy only; canonical code is **251001**.
