# IBC

Track physical IBC containers as identifiable assets across custody, commercial modality, quality, and return obligations — not as anonymous stock quantity. Focus is the **container**, not product shelf life.

## Language

**IBC**:
A physical intermediate bulk container treated as a uniquely identified asset (identifier number + QR). Stock counts are projections over IBCs, not the source of truth.
_Avoid_: Estoque (as if quantity alone answered custody/quality), Container genérico sem identidade, validade do produto químico (out of this context)

**Data limite de uso**:
The last date this IBC asset may still be used in circulation. Property of the IBC itself.
_Avoid_: Validade (alone), prazo de devolução, shelf life do produto

**CODIGO_EMBALAGEM (Sapiens)**:
ERP field `der.usu_codemb` on the Pedido item line. Value **251001** identifies a container (IBC) line. Exposed via `QUERY_GET_PEDIDOS_BY_CARGA` (not the general pedidos BASE query).
_Avoid_: treating packaging code as a quantity, legacy code 251004, invented name QUANTIDADE_EMBALAGEM

**VOLUME_EMBALAGEM (Sapiens)**:
ERP field `der.usu_qtdmve` — packaging volume/capacity. Divisor in the container-count formula. Not the expected container count itself.
_Avoid_: calling this “quantidade esperada”, conflating with CODIGO_EMBALAGEM

**QUANTIDADE_PEDIDO (Sapiens)**:
ERP field `ipd.qtdped` — ordered quantity on the line. Numerator in the container-count formula (only when CODIGO_EMBALAGEM = 251001).
_Avoid_: treating raw qtdped as container count without dividing by VOLUME_EMBALAGEM

**INCLUSO (Sapiens)**:
ERP field `ipd.usu_embinc` on a **container** line only. After trim/upper: `"S"` → Venda count; any other value (incl. null/empty) → Empréstimo count. Ignored on non-251001 lines.
_Avoid_: applying INCLUSO to non-container packaging, calling INCLUSO=N “Troca” at outbound

**CargaDespacho**:
Intermediate record when logistics **closes a Carga**: links the cargo to one truck (`Trucks`). Truck mandatory at close; motorista not required in v1 (#89). 1:1 per cargo. Audit: who closed, when.
_Avoid_: Caminhao (deprecated freight table), closing cargo without truck, requiring motorista on close, multiple dispatches per cargo in v1

**AlocacaoIbc**:
Link between an IBC and a **Carga** during yard preparation. `numPed` stays empty on the way out. Not item-level. The Pedido is born on the return, when ALMOX points an eligible Pedido from the Relatório de Viagem. Mutable until `ExpedicaoIbc`; immutable after. The cap is the sum of expected quantities of eligible Pedidos on the foto; a **Pedido misto** stays outside that sum.
_Avoid_: choosing the Pedido on the way out, item-level allocation, treating allocation as confirmed customer custody, linking Inapto, in-transit, no-cliente, entrada pendente, or substituído IBCs

**ExpedicaoIbc**:
The act of **closing expedition** after preparation: the count of IBCs linked to the Carga equals the sum of expected quantities of eligible Pedidos on a FECHADA cargo. A different count is refused. Creates audit record; moves allocated IBCs to **Em viagem**; locks `AlocacaoIbc` records, still without a Pedido.
_Avoid_: "Saída da empresa" (use Fechar expedição), closing expedition on ABERTA cargo, closing pedido by pedido, LancamentoIbc (deprecated name)

**Transbordo**:
Unload the product at the customer and bring **the same** company IBC back. Custody at the customer is momentary; the asset identity does not change hands.
_Avoid_: Troca, Empréstimo, “devolver um vazio” when you mean the same numbered IBC

**Troca de IBC**:
Ownership swap recorded **1:1** by the patio on return: e.g. **#H030 was exchanged for #H067**. The inbound unit (no company QR yet) is cadastrado with a new identifier + QR, Aquisição = troca, and explicitly linked to the outbound IBC it replaces. The same trip may mix ficou, retorno and troca. What stayed follows the Pedido pointed on the return; transbordo is not a label on the paper.
_Avoid_: Transbordo, lot-only counting without #out↔#in link, treating every empty on the truck as the same modality

**Empréstimo**:
Prolonged custody of the **same** company IBC at the Cliente, with an obligation to return that same identifier and an expected return date. This is what feeds “who didn’t return”; Transbordo does not.
_Avoid_: Transbordo, Troca de IBC, Venda

**Venda**:
Definitive transfer of IBC ownership to the Cliente; the asset leaves the company pool with no return obligation. If the packaging must come back, that is Empréstimo in this context — even when the chemical on the Pedido was sold.
_Avoid_: Empréstimo, calling a returnable IBC a “venda” inside this module

**Inspeção de IBC**:
A recorded quality check of an IBC. The operator scores every **active** checklist item from the quality POP catalog; each score is stored linked to that item. Yields aptidão and condition history.
Registered via `POST /api/ibc/:id/inspecoes` `{ checklistModeloId, respostas: [{ checklistItemId, nota }], observacao? }` (ADMIN/ALMOX, 201 `{ inspecao, ibc: { aptidao, motivoInaptidao, primeiraInspecaoEm }, aviso? }`). The inspeção is saved and aptidão recalculated in one transaction with the `Ibc` row locked. Refusals, in precedence order: role 403; invalid body / nota outside 0–10 or not integer 400 `IBC_INSPECAO_INVALID_BODY`; missing or baixado IBC 404 `IBC_NOT_FOUND`; Em viagem 409 `IBC_EM_VIAGEM`; checklist not linked 422 `IBC_CHECKLIST_NAO_VINCULADO`; inactive checklist 422 `IBC_CHECKLIST_INATIVO`; missing active item or unknown/duplicate item 422 `IBC_INSPECAO_RESPOSTAS_INCOMPLETAS`. A reprovada inspeção on an IBC with an open alocação still returns 201, keeps the alocação and adds `aviso: { code: "IBC_ALOCADO_INAPTO", codCar, numPed }`.
Each inspeção is immutable and snapshots `notaMinimaCritico`, `mediaMinima`, `mediaObtida` and, per resposta, the item's `critico` and `descricao`; later edits to the item or checklist never rewrite history. `GET /api/ibc/:id/inspecoes` (ADMIN/ALMOX/LOGISTICA/GERENTE_DPTO; also for baixados) lists them newest first as `{ id, checklistModeloId, checklistNome, resultado, mediaObtida, notaMinimaCritico, mediaMinima, inspetor: { id, nome }, inspecionadoEm, observacao, respostas: [{ checklistItemId, descricao, critico, nota }] }` (respostas: críticos first, then by descrição); missing IBC 404 `IBC_NOT_FOUND`; never inspected → `[]`.
_Avoid_: treating “qualidade” as a single vague field with no checklist, hardcoding factors only in UI without a catalog table, editing or deleting a recorded inspeção

**Item de checklist**:
A cadastrable quality POP factor/question in the single shared catalog (`ChecklistItem`, also used by Vistoria). `critico` is a property of the item and holds in every checklist it appears in. An inactive item cannot be added to checklists but stays in history. Managed via `/api/ibc/checklist-itens` (ADMIN/ALMOX).
_Avoid_: embedding checklist only as code constants with no admin cadastro, marking "crítico" per checklist instead of per item

**Checklist de IBC**:
A named set of catalog items (e.g. "Checklist Soda", "Estrutural") stored in `ChecklistModelo` with `tipo = IBC`, ordered items (`ChecklistModeloItem.ordem`), `notaMinimaCritico` and `mediaMinima` (0–10, required for IBC), and `ativo`. Vistoria screens only see `tipo = VISTORIA`.
Managed via `/api/ibc/checklists` (GET/POST) and `/api/ibc/checklists/:checklistId` (GET/PATCH); reads ADMIN/ALMOX/LOGISTICA/GERENTE_DPTO, writes ADMIN/ALMOX. `itensIds` is the full ordered list (array index = `ordem`, no duplicates, at least one); sending it on PATCH replaces all items. An inactive item cannot be added (422 `IBC_CHECKLIST_ITEM_INATIVO`), but one already in the checklist that was deactivated later may stay. Unknown item → 404 `IBC_CHECKLIST_ITEM_NOT_FOUND`; missing or non-IBC checklist → 404 `IBC_CHECKLIST_NOT_FOUND`. Deactivation is `ativo: false` (no delete).
_Avoid_: separate checklist tables for IBC, showing IBC checklists in Vistoria, adding inactive items, deleting checklists

**Vínculo de checklist**:
Link between one IBC and one **Checklist de IBC** (`IbcChecklistVinculo`: author `vinculadoPorId` → `User` + `vinculadoEm`; unique per IBC + checklist). An IBC may have several (e.g. one per product it carries); the same checklist may be linked to many IBCs. `GET /api/ibc/:id/checklists` (ADMIN/ALMOX/LOGISTICA/GERENTE_DPTO; also for baixados) lists them by checklist name as `{ checklistModeloId, nome, ativo, vinculadoEm, vinculadoPor: { id, nome } }`, including checklists deactivated later. `POST /api/ibc/:id/checklists` `{ checklistModeloId }` (201) and `DELETE /api/ibc/:id/checklists/:checklistModeloId` (204) are ADMIN/ALMOX only. Refusals: missing IBC (or baixado, on POST/DELETE) 404 `IBC_NOT_FOUND`; missing checklist 404 `IBC_CHECKLIST_NOT_FOUND`; `tipo = VISTORIA` 422 `IBC_CHECKLIST_TIPO_INVALIDO`; inactive 422 `IBC_CHECKLIST_INATIVO`; duplicate (including concurrent requests) 409 `IBC_CHECKLIST_JA_VINCULADO`; invalid body 400 `IBC_CHECKLIST_VINCULO_INVALID_BODY`; unlinking a missing link 404 `IBC_CHECKLIST_VINCULO_NOT_FOUND`. A link to a deactivated checklist can still be unlinked; unlinking deletes the row (no history). Linking or unlinking **never changes aptidão** (`aptidao`, `motivoInaptidao`, `primeiraInspecaoEm`).
_Avoid_: recalculating aptidão on link, linking VISTORIA checklists, treating the link as an Inspeção

**Aptidão**:
Whether the IBC may be used in circulation right now: **Apto** or **Inapto**. Inapto must surface as an alert in the IBC module (identifier visible, with reason). Reasons (`motivoInaptidao`): `DATA_LIMITE`, `INSPECAO_REPROVADA`, `AGUARDANDO_INSPECAO`. Recalculated on every Inspeção, in the same transaction:
- `DATA_LIMITE` prevails (already marked or due now): the inspeção is recorded and the IBC stays Inapto/`DATA_LIMITE`.
- Otherwise, if the latest inspeção of any **linked checklist that has been inspected** is reprovada → Inapto/`INSPECAO_REPROVADA` (blocks AlocacaoIbc with 409 `IBC_INAPTO`; an existing open alocação is kept).
- Otherwise → Apto, clearing `INSPECAO_REPROVADA` and `AGUARDANDO_INSPECAO`. A linked checklist never inspected does not block.

`GET /api/ibc/alerts` lists `{ identificador, motivo, detalhes? }`. `INSPECAO_REPROVADA` is derived from the latest reprovada inspeção per linked checklist (read in batch), so it can appear alongside `DATA_LIMITE`, and carries `detalhes: { checklists: [{ checklistModeloId, nome, mediaObtida, mediaMinima, itensAbaixoDoMinimo: [{ descricao, nota, notaMinima }] }], alocacao?: { codCar, numPed } }`. `itensAbaixoDoMinimo` uses the inspeção snapshot: a critical item below `notaMinimaCritico` (`notaMinima` = `notaMinimaCritico`) or a non-critical item below `mediaMinima` (`notaMinima` = `mediaMinima`). It disappears once that checklist's latest inspeção is aprovada. An IBC still marked `INSPECAO_REPROVADA` with no reprovada linked checklist (e.g. unlinked later) gets the alert without `detalhes`.
_Avoid_: “qualidade” alone, hiding inaptidão only inside a detail screen, letting an approved inspeção clear `DATA_LIMITE`

**Score do fator**:
Numeric score given to one **Item de checklist** in an Inspeção de IBC (stored as IbcInspecaoResposta). Closed scale: integer 0–10, one per active item of the checklist (no decimals, no stars). Critical items (`critico`) must score ≥ the checklist's `notaMinimaCritico`; the average of non-critical items must be ≥ `mediaMinima` (no non-critical items → only the critical rule applies; the exact limit passes). Evaluated by `avaliarInspecaoIbc` → `APROVADA`/`REPROVADA` + `mediaObtida` (null without non-critical items).
_Avoid_: binary aprovado/reprovado as the primary checklist result, a single score with no per-item breakdown, scores without FK to the catalog

**Inapto por data limite**:
Automatic Inapto when Data limite de uso is reached or exceeded, regardless of the latest inspection scores.
_Avoid_: treating expiry as only an informational note while still allowing circulation

**Prazo de devolução**:
Expected return date for an Empréstimo. The loan starts at **Fechar Viagem**, not at outbound: `AlocacaoIbc.emprestimoIniciadoEm` and `emprestimoVenceEm` = start + **90** UTC days. The allocation stays open. #41 reads `emprestimoVenceEm`.
_Avoid_: Data limite de uso, 30 days from Fechar expedição, closing or deleting the AlocacaoIbc of a loan

**Preparação de expedição**:
ALMOX links Apto IBCs to the **Carga**, with no Pedido. One list of the Carga: linked containers against the expected total. Allowed only while cargo is **FECHADA** and has a **Foto de pedidos IBC**; the foto is the only source of which Pedidos are eligible and of quantidade esperada (Sapiens is not read). ABERTA → 409 `IBC_CARGA_NAO_FECHADA`; FECHADA without foto → 409 `IBC_CARGA_SEM_FOTO_EXPEDICAO`. An **IBC substituído** → 409 `IBC_SUBSTITUIDO` (there is no scan endpoint yet; the same guard is the allocation gate). Also refused: Inapto, Em viagem, Custódia no Cliente, Entrada pendente, already allocated, above the cargo total. A **Pedido misto** is an alert and stays outside the total; the other Pedidos of the Carga still count. Unlink is allowed until expedição closes. Physical placement on the truck does not assign a numbered IBC to a client.
_Avoid_: a card per Pedido, choosing the Pedido on the way out, item-level linking, Custódia no Cliente, preparing on ABERTA cargo, re-reading pedidos from Sapiens after close, dropping the rest of the Carga because one Pedido is misto

**Em viagem**:
IBC custody state after **ExpedicaoIbc** is closed and before **Fechar Viagem**. The asset is on the truck, not in the yard and not yet confirmed at a Cliente. `GET /api/ibc/expedicoes/em-viagem` (ALMOX/ADMIN) lists a carga while `ExpedicaoIbc.viagemFechadaEm` is null and at least one allocated IBC is still `custodia = EM_VIAGEM`, ordered by `fechadoEm` desc.
_Avoid_: No Cliente, Em estoque / no pátio, Situação da Carga, keeping a closed trip on this list

**Relatório de Viagem**:
Paper the driver marks by hand after **ExpedicaoIbc**. `GET /api/ibc/expedicoes/:codCar/relatorio-viagem` (ADMIN/ALMOX) returns JSON only — the PDF is built in the browser and is not stored. One block per Pedido (two Pedidos of the same cliente are two blocks), ordered by the Carga's delivery order (`comparePedidosOrdemEntrega`: lowest `posCar`; null `posCar` falls back to lowest `numPed`). Each block carries cliente, `numPed`, quantidade esperada and whether the Pedido is incluso. Every block repeats the full IBC list of the Carga, ordered by `identificador`. An incluso block prints the badge **Incluso** on every line, before any mark. An empréstimo block has no modality label. Nothing is pre-marked. Each line has an empty ficou box and an empty troca box. There is no empréstimo, transbordo or retorno label. Missing carga → 404 `IBC_CARGA_NOT_FOUND`. No `ExpedicaoIbc` → 409 `IBC_EXPEDICAO_AUSENTE`. There is no MOTORISTA login.
_Avoid_: one block per cliente, a modality label on an empréstimo block, a transbordo or retorno column, pre-checking a box, filtering the list by the block's Pedido, generating or storing the PDF on the server

**Custódia no Cliente**:
`custodia = CLIENTE`. Set by **Fechar Viagem** on each IBC marked FICOU or on the `#out` of a Troca, for the Pedido pointed on the return. The client is the client of that pointed Pedido. Incluso (derived Venda) leaves the pool via `motivoBaixa VENDA`, with no prazo and no aviso. Empréstimo (no `motivoBaixa`) stays in vivos WP with the 90-day prazo, and the allocation stays open. Allocation and inspeção refuse `CLIENTE` with 409 `IBC_NO_CLIENTE`. Soft delete refuses `CLIENTE` and any `motivoBaixa` with 409 `IBC_BAIXA_BLOQUEADA`. The Troca `#out` follows that same Pedido rule and stores `trocaEntradaId` pointing at the `#in`, without `baixadoEm`.
_Avoid_: a driver screen that scans custody, inheriting a Pedido from the way out, asking ALMOX to choose Venda vs Empréstimo, an aviso for incluso, treating `motivoBaixa` as soft delete, closing the loan allocation

**Fechar Viagem**:
ALMOX/ADMIN transcribes the paper, IBC by IBC: `FICOU`, `RETORNOU` or `TROCA`. FICOU and TROCA require an eligible Pedido of that Carga; the body does not carry a modality — it is derived from the Pedido (only incluso → Venda; only empréstimo → Empréstimo). RETORNOU stores no Pedido. Partial progress: `GET`/`PUT /api/ibc/expedicoes/:codCar/conciliacao`. An open trip returns the Carga's containers without a chosen Pedido, even when the allocation still has the outbound Pedido, plus the eligible Pedidos with quantidade esperada and quantidade já apontada (ficou + troca). The pointed Pedido is stored on the mark and on `AlocacaoIbc`. A trip already closed keeps the Pedido stored on the allocation; this contract does not rewrite it. Close: `POST /api/ibc/expedicoes/:codCar/fechar-viagem` body `{ confirmacoes?: [{ numPed }] }`, one transaction, a destino on every container. FICOU or TROCA without an eligible Pedido refuses the close (`422 IBC_CONCILIACAO_PEDIDO`). Per Pedido, when apontada (ficou + troca) differs from esperada, the close is accepted only when that `numPed` is listed in `confirmacoes`; without it the close is refused with `409 IBC_DIVERGENCIA_PEDIDO` and `{ divergencias: [{ numPed, quantidadeEsperada, quantidadeApontada }] }`. A Pedido that already matches does not need a confirmation, and confirming one Pedido does not drop the others. The body does not write to Sapiens. A trip already closed (`viagemFechadaEm` set) is refused with `409 IBC_VIAGEM_JA_FECHADA` and is not rewritten. `RETORNOU` calls `AbrirEntradaPatio` (`origem RETORNO`), sets `AlocacaoIbc.encerradaEm` and leaves no cliente. FICOU or TROCA on an incluso Pedido sets `custodia CLIENTE` and `motivoBaixa VENDA`, with no prazo and no aviso. FICOU or TROCA on an empréstimo Pedido sets `custodia CLIENTE` and the 90-day loan from the close (UTC); the allocation stays open and the aviso uses that Pedido. A **Pedido misto** is not eligible. Troca `#in` is `POST .../conciliacao/trocas` (`tipoCadastro` and `aquisicao` TROCA, Inapto `AGUARDANDO_INSPECAO`, custódia PÁTIO) linked on the conciliation row; close calls `AbrirEntradaPatio` (`origem TROCA`) and the `#out` follows the pointed Pedido (VENDA baixa or the 90-day loan) and stores `trocaEntradaId`. Who/when: `ExpedicaoIbc.viagemFechadaPorId` / `viagemFechadaEm`. Outbox `ViagemIbcFechada` (`aggregateType ExpedicaoIbc`, payload includes `ficaram`) is the hook for the aviso — the consumer is not this feature and keeps only empréstimos. Role is enforced in the use case: 403 `IBC_VIAGEM_FORBIDDEN`. Also 404 `IBC_CARGA_NOT_FOUND`, 409 `IBC_EXPEDICAO_AUSENTE`, 409 `IBC_VIAGEM_INCOMPLETA`, 409 `IBC_DIVERGENCIA_PEDIDO`, 409 `IBC_CONCILIACAO_FORA_DA_VIAGEM`, 422 `IBC_CONCILIACAO_MODALIDADE` when the body sends a modality, 422 `IBC_CONCILIACAO_PEDIDO` when ficou or troca has no eligible Pedido or retornou carries one, 409 `IBC_TROCA_SEM_ENTRADA`, 409 `IBC_TROCA_JA_VINCULADA`, 409 `IBC_TROCA_DESTINO`.
_Avoid_: choosing Venda or Empréstimo on the screen, pre-selecting a Pedido from the way out, a paper count per cliente as the divergence rule, implementing the aviso consumer here, deleting the allocation to free `ibcId`, setting `baixadoEm` for Venda or Troca

**Entrada no pátio**:
Etapa própria antes do IBC voltar ao estoque do pátio. `AbrirEntradaPatio` abre um `EntradaPatioIbc` pendente (`origem` `RETORNO` ou `TROCA`) e aceita a transação do chamador — a #38 usa o mesmo use case, dentro da transação dela, para IBCs com destino RETORNOU e para o `#in` da Troca. `RETORNO` exige custódia `EM_VIAGEM`. `TROCA` exige `aquisicao` ou `tipoCadastro` `TROCA` e custódia `PATIO` (recém-cadastrado). A abertura muda a custódia para `ENTRADA`: o IBC sai da lista do pool e a alocação recusa com 409 `IBC_ENTRADA_PENDENTE`. Aptidão fica Inapto `AGUARDANDO_INSPECAO`, salvo `DATA_LIMITE` já vigente. Inspeções feitas com a entrada aberta ligam-se a ela (`IbcInspecao.entradaPatioId`). Concluir exige ≥1 checklist ativo vinculado e uma inspeção dessa entrada para cada um; a custódia volta a `PATIO` — todas aprovadas → Apto; alguma reprovada → Inapto `INSPECAO_REPROVADA`; `DATA_LIMITE` prevalece. Papel ADMIN/ALMOX no use case. `POST /api/ibc/:id/entrada-patio` `{ origem }` abre (201). `GET /api/ibc/entradas-patio` lista as pendentes, mais antigas primeiro, com cada checklist ativo e se já há inspeção desta entrada. `POST /api/ibc/:id/entrada-patio/concluir` conclui (200) e devolve custódia `PATIO` mais a aptidão. Só checklist **ativo** vinculado conta; vínculo inativo não bloqueia. Inspeção anterior à abertura não conta — a #272 grava `entradaPatioId` na transação da inspeção enquanto a entrada está pendente. Várias inspeções do mesmo checklist: vale a mais recente desta entrada. Recusas da abertura: papel 403 `IBC_ENTRADA_FORBIDDEN`; corpo inválido 400 `IBC_ENTRADA_INVALID_BODY`; ausente ou baixado 404 `IBC_NOT_FOUND`; já pendente 409 `IBC_ENTRADA_JA_ABERTA`; retorno fora de Em viagem 409 `IBC_NAO_EM_VIAGEM`; ativo que não é Troca 422 `IBC_ENTRADA_NAO_E_TROCA`; Troca fora do pátio 409 `IBC_ENTRADA_CUSTODIA_INVALIDA`. Recusas da conclusão: sem pendente 404 `IBC_ENTRADA_NAO_ENCONTRADA`; nenhum checklist ativo 422 `IBC_ENTRADA_SEM_CHECKLIST`; checklist ativo sem inspeção desta entrada 422 `IBC_ENTRADA_INSPECAO_PENDENTE`.
_Avoid_: Custódia no Cliente, devolver ao pátio sem inspeção, tratar o `#in` da Troca como Apto, abrir a entrada da Troca antes do Fechar Viagem

**Pedido com IBC**:
A Pedido with at least one valid container line (`CODIGO_EMBALAGEM = 251001` and valid count calculation). Eligible ones (not **Pedido misto**, not **Pedido IBC inválido**) feed the Carga total, the Relatório blocks and the return pick-list.
_Avoid_: showing every Pedido of the Cliente, using product quantity alone to detect packaging type

**Quantidade esperada de IBC**:
Backend-computed container target for a Pedido: for each 251001 line, `QUANTIDADE_PEDIDO / VOLUME_EMBALAGEM`, then sum. Also split into **quantidadeEsperadaVenda** (INCLUSO = S) and **quantidadeEsperadaEmprestimo** (otherwise). Allocation / Fechar expedição use the **sum of eligible Pedidos**. A **Pedido misto** stays outside that sum.
_Avoid_: computing in SQL for all pedidos, QUANTIDADE_EMBALAGEM, reading count from code 251001, silent rounding, capping each Pedido on the way out

**Pedido IBC inválido**:
A Pedido with a 251001 line where VOLUME_EMBALAGEM ≤ 0 or the division is not an integer. Outside the cargo total; ALMOX sees an alert; other Pedidos on the Carga proceed.
_Avoid_: dropping the bad line and summing the rest, failing the whole Carga

**Pedido misto**:
A Pedido on the foto whose container lines carry both an incluso quota and an empréstimo quota (venda and empréstimo expected quantities both above zero). Refused for the cargo total and for the return pick-list. It does not drop the other Pedidos of the Carga.
_Avoid_: splitting one Pedido across both modalities, failing the whole Carga, treating it as Pedido IBC inválido

**Foto de pedidos IBC (CargaPedidoIbc)**:
Frozen record, one row per Pedido with the 251001 signal (valid or **Pedido IBC inválido**), written in the **same transaction** as Fechar Carga from the pedidos that close already reads from Sapiens. Stores `numPed`, `codCli`, `cliente`, quantidade esperada (total, venda, empréstimo), `ibcInvalido` (quantities 0) and `posCar` (delivery order of the Pedido in the Carga, from Sapiens `usu_poscar`; null when Sapiens has none (NULL or 0) and in fotos recorded before the column existed — used by the Relatório de Viagem to order the blocks, one per Pedido). Unique per Carga + Pedido. Pedidos without 251001 are not recorded; a Carga without IBC has no foto. No backfill for cargas closed before the table existed.
_Avoid_: re-reading Sapiens after close to decide IBC eligibility (sitped changes on invoicing), blocking Fechar Carga because of a Pedido IBC inválido, one row per item line

**Quantidade realizada de IBC**:
How many IBCs were pointed to that Pedido on the return (ficou + troca). Compared with Quantidade esperada; a difference closes only with an explicit confirmation for that Pedido.
_Avoid_: treating AlocacaoIbc counts as Custódia no Cliente, QR scans by the driver as the system record

**INCLUSO → modalidade**:
On container lines only: `"S"` → **Incluso**, derived as Venda on the return; anything else → **Empréstimo**. The modality comes from the Pedido pointed on the return. It is not chosen on the way out and it is not sent in the conciliation body. Troca is return-side only. A Pedido that is both is a **Pedido misto** and is refused.
_Avoid_: asking ALMOX or the driver to pick Venda vs Empréstimo, applying the split as an outbound link per Pedido, conflating INCLUSO=N with Troca

**Aquisição do IBC**:
How this asset entered the company pool: **compra** or **troca**. Set at cadastro. Inbound units that arrive without QR after a trip are registered by the patio operator as new IBCs with Aquisição = troca (Troca de IBC), not treated as anonymous stock.
_Avoid_: leaving pool origin blank, calling every inbound empty an Empréstimo return of a known IBC

**Pendente de retorno**:
An IBC from this Carga/trip that was confirmed in Custódia no Cliente and has not returned with a company QR. Default pick-list when linking a Troca de IBC (#out → #in). Older Empréstimos at the same Cliente are a secondary path, not the default.
_Avoid_: free search across the whole pool as the primary Troca UI, linking a return to an IBC still in the yard

**Produto para Container**:
Cadastrable product (`IbcProduto`: nome + abreviação of 1–2 letters A–Z, unique) that composes the IBC identifier. Every new IBC must have one.
Nome is always editable. Abreviação (sigla) is frozen once any IBC is linked to the product — baixados included, since baixa does not free a sequencial and the stored prefixo is never recalculated (409 `IBC_PRODUTO_ABREVIACAO_EM_USO`; sending the same sigla after normalization is not a change). To use another sigla, register a new product and apply a Mudança de produto. The product list exposes `possuiIbcs` so the UI can lock the field.
_Avoid_: hardcoding product prefixes (fixed HMS/NHS list), product shelf life, renaming the sigla of a product in use (one product with two prefixos, or one prefixo meaning two products)

**Identificador do IBC (prefixo + sequencial)**:
`prefixo` + 5-digit zero-padded `sequencial`. Prefixo = `HM` + abreviação (homologado) or `NHM` + abreviação (não homologado); e.g. Soda (S) → `HMS00001` / `NHMS00001`. `(prefixo, sequencial)` and `identificador` are unique; the next sequencial is the max of that exact prefixo + 1, allocated under a per-prefix lock. Baixa does not free a sequencial. Legacy `HM####` (4 digits, no product) keeps its identifier with prefixo `HM`.
_Avoid_: deriving the next code by `startsWith` on the identifier (HMS ≠ HMSO), reusing sequenciais

**Conversão para não homologado**:
Manual, confirmed action that never edits the source IBC: creates a new IBC in `N` + source prefixo (HMS → NHMS) with the next sequencial, links the source via `convertedToContainerId` and records an `IbcConversionHistory` event (`conversion`) with actor and optional observação.
_Avoid_: editing homologação in place, automatic expiry-driven conversion (out of scope)

**Mudança de produto**:
Same lineage mechanics as Conversão, but the new IBC takes the target product prefixo in the same homologação family (HMS → HMSO, NHMS → NHMSO); history event `product_change`.
_Avoid_: patching `produtoId` on the existing IBC

A source with `convertedToContainerId` already set cannot be converted nor have its product changed again (409 `IBC_JA_SUBSTITUIDO`); further changes start from the replacement IBC. The link is set only while the source is still free, so concurrent requests produce a single replacement.

**IBC substituído**:
Source IBC of a Conversão or Mudança de produto: `convertedToContainerId` is set and `baixadoEm` stays null. The row is not edited and is not given baixa — substituição is not baixa. It drops out of the active pool (`listActiveIbcs`, `listIbcs` without baixados, alertas, pool padrão) and out of vivos WP (`countVivosWp`). `GET /api/ibc?incluirBaixados=true` still returns it so the audit list can mark it Substituído. `GET /api/ibc/:id/historico` stays available from the source. Allocating it returns 409 `IBC_SUBSTITUIDO`. The product-abbreviation freeze still counts it (`IbcProduto` usage), because baixa is what does not free a sequencial and the stored prefixo is never recalculated.
_Avoid_: automatic baixa on conversion, treating substituição as baixa, keeping the source on active lists or in vivos WP

**Histórico de conversões**:
Audit trail of structural changes (`from` → `to`, tipo, observação, actor, date), queryable from either end via `GET /api/ibc/:id/historico`.
_Avoid_: mixing with inspeção or custódia history

**Cadastro em lote**:
Purchase batch: operator provides N, one shared `dataLimite`, optional NF trace and the Produto; system creates N Novo IBCs (COMPRA / PATIO / Apto + Sem inspeção) with consecutive sequenciais of the product prefixo in one transaction. Soft-warns when vivos+N > ERP saldo for codpro 251001; never hard-blocks. Vivos excludes baixados and IBCs substituídos.
_Avoid_: troca/return batch, hard cap vs ERP, ERP stock write-back

**Saldo ERP IBC (codpro 251001)**:
Read-only Sapiens stock of product-container via `e210est.qtdest` (`SUM` for company). Port returns available quantity or unavailable. Distinct from packaging-line `CODIGO_EMBALAGEM` math on pedidos.
_Avoid_: treating packaging expected count as fiscal saldo, writing stock to ERP

**Aguardando inspeção**:
Aptidão Inapto (`motivoInaptidao = AGUARDANDO_INSPECAO`) enquanto a Entrada no pátio está pendente, e também no `#in` da Troca assim que ele é cadastrado (ainda no pátio, para não voltar à alocação). O cadastro Novo não grava esse motivo (#271). Não libera Preparação de expedição. Sai na conclusão da entrada (Apto, ou substituído por `INSPECAO_REPROVADA` / `DATA_LIMITE`). Uma inspeção gravada no meio da entrada pode recalcular a aptidão (#272); a custódia `ENTRADA` é o que mantém o IBC fora do pool e da alocação até concluir. O outbound substituído numa Troca deixa o pool da empresa.
_Avoid_: usar no cadastro Novo, tratar retorno “conhecido bom” como Apto, manter o IBC Em viagem depois de abrir a entrada

**Sem inspeção**:
Non-blocking alert (`SEM_INSPECAO`) for an IBC that was never inspected (`primeiraInspecaoEm` null). Every cadastro (unitário and lote) starts this way; the IBC is Apto and can be allocated. The alert clears only on the first **aprovada** Inspeção (`primeiraInspecaoEm` is set then; a reprovada one does not set it). Independent of aptidão: an expired IBC can show both `DATA_LIMITE` and `SEM_INSPECAO`. Conversão and Mudança de produto inherit it from the source.
_Avoid_: treating it as Inapto, blocking AlocacaoIbc because of it, deriving it from `motivoInaptidao`

**Aviso ao Representante**:
In-app notice after **Fechar Viagem**, one row per viagem + pedido (`AvisoRepresentanteIbc`, unique `expedicaoIbcId` + `numPed`). Consumer `IBC_AVISO_REPRESENTANTE` reads outbox `ViagemIbcFechada` (routing key `viagem.ibc.fechada`). It groups empréstimo `ficaram` by the Pedido pointed on the return. Incluso does not generate a notice. It takes `codRep` from that Pedido on the frozen `CargasFechadas.pedidos` of the expedição's carga (Sapiens is not read again), and copies `AlocacaoIbc.emprestimoVenceEm` already stored — the 90 days are not recomputed. A pedido with no valid `codRep` is skipped and logged (`numPed`); the other pedidos of the same event are still saved. `ProcessedEvent` (`consumerName` + `eventId`) is inserted in the **same** transaction, **after** the avisos, so a failed insert is retried. A replay does not create a second card. The consumer only inserts those two tables. Out of this notice: e-mail, WhatsApp, SSE, the overdue panel (#41), and the custody buckets (#119).
_Avoid_: generating the notice inside Fechar Viagem, changing custódia, `motivoBaixa` or allocation closure, recomputing the return date, treating Troca as an aviso, deleting the aviso when the IBC later returns

**Conciliação ERP**:
Read-only report of Sapiens fiscal saldo (`codpro` 251001, `e210est.qtdest`) against WorkaPool custody. Distinct from **Fechar Viagem**, which transcribes the paper checklist (`ConciliacaoViagemIbc`). The source is `Ibc` plus the open `AlocacaoIbc` (cliente, pedido and stored `emprestimoVenceEm` via `CargaPedidoIbc`). It is not `AvisoRepresentanteIbc`.

One IBC falls in exactly one lifecycle bucket, in this order: **Baixados** (`baixadoEm` set — avaria/descarte is not a new `motivoBaixa`), **Substituídos** (`convertedToContainerId`; not baixa), **Vendidos** (`motivoBaixa = VENDA`), **Troca** (`motivoBaixa = TROCA`, the `#out` only; the `#in` stays in its custody bucket and the pair is `#out.identificador` + `#out.trocaEntrada.identificador`), **Em viagem**, **Entrada no pátio** (`custodia = ENTRADA`), **No cliente** (empréstimo: `CLIENTE` and no `motivoBaixa`), **Pátio** (includes a troca `#in` whose entrada already finished).

`vivosWp = pátio + em viagem + entrada + no cliente` — the same population as `countVivosWp()` (no soft delete, no `motivoBaixa`, no substituído). Vendidos, Troca `#out`, Baixados and Substituídos are listed with a count and `entraNaSoma: false`. `residual = saldoErp.quantity - vivosWp` when the saldo is available; it may be negative and `qtdest` is not rounded. When the saldo is unavailable, `residual` is null (unavailable is not zero).

**Serial sem NF** is an orthogonal cut and does not add into the sum again: `aquisicao = COMPRA`, still vivo, and (`loteId` null or `numeroNf` null). The IBC stays in its custody bucket. **NF sem serializar** has no declared quantity on `IbcLote` (only `numeroNf`), so that cut is `status: "indisponivel"` and `count: null`. The "comprei e não cadastrei" gap is the residual. An empréstimo row carries `cliente`, `pedido` (`numPed`) and the stored `emprestimoVenceEm`; this report does not derive “atrasado” (#41). VENDAS cannot read it.
_Avoid_: Fechar Viagem conciliation, using `AvisoRepresentanteIbc` as the source, summing vendidos/troca/baixados/substituídos into vivos, clamping the residual at zero, inventing an NF quantity or a baixa enum, an overdue flag

**Empréstimos em atraso**:
Read-only list of **Empréstimo** rows whose **Prazo de devolução** is already past and the IBC is still in **Custódia no Cliente**. At instant `now`, every condition holds: `Ibc.custodia = CLIENTE`, `motivoBaixa` null (Venda and the Troca `#out` stay out), `baixadoEm` null, `convertedToContainerId` null, and the latest open `AlocacaoIbc` (`encerradaEm` null, `alocadoEm` desc) that has `emprestimoVenceEm` satisfies `emprestimoVenceEm < now` (the exact instant is not overdue). Cliente, `codCli` and `numPed` come from `CargaPedidoIbc` of the same carga and pedido; a missing foto keeps the row and leaves cliente null. `codCar` comes from `Cargas`. `codRep` comes from `resolverCodRepPedidoFechado` on the latest `CargasFechadas` of that carga (`createdAt` desc); a missing `codRep` does not drop the row. ADMIN, LOGISTICA and GERENTE_DPTO see every row. VENDAS sees only the JWT `codRep`; absent, non-integer or ≤ 0 yields an empty list (`999` is that representative, not a wildcard). ALMOX, USER and MOTORISTA are refused with 403 `IBC_EMPRESTIMO_ATRASADO_FORBIDDEN`. Order is `emprestimoVenceEm` ascending, then `identificador`. The stored date is not recomputed (still 90 UTC days from **Fechar Viagem**). This list is not **Aviso ao Representante** and does not add an overdue flag to **Conciliação ERP**.
_Avoid_: a 30-day recut, editing `emprestimoVenceEm`, a devolution screen, e-mail/WhatsApp/SSE, pagination
