import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIbcChecklistVinculos } from "../hooks/useIbcChecklistVinculos";
import { useIbcChecklistDetalhe, useRegistrarIbcInspecao } from "../hooks/useIbcInspecao";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import type { IbcChecklistItemNoChecklistDTO, IbcChecklistItemRespostaEsperada } from "../types/ibcChecklist.types";
import { labelBloqueanteSimNao, labelRespostaSimNao } from "../utils/ibcChecklistLabels";
import {
  buildInspecaoPayload,
  checklistInspecaoExigeMinimas,
  checklistInspecaoSemMinimasConfiguradas,
  countItensInspecaoPreenchidos,
  formatNotaInspecao,
  type InspecaoItemRascunho,
  listItensInspecao,
} from "../utils/ibcInspecao.utils";
import { IBC_OBSERVACAO_MAX } from "../utils/ibcMudanca.utils";
import { toError } from "../utils/toError";
import CadastroIbcSectionError from "./CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "./CadastroIbcSectionSkeleton";

type IbcInspecionado = Pick<IbcCadastroDTO, "id" | "identificador">;

type Props = {
  open: boolean;
  ibc: IbcInspecionado | null;
  onClose: () => void;
};

export default function IbcInspecaoDrawer({ open, ibc, onClose }: Props) {
  return (
    <Sheet open={open && ibc != null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent>{ibc ? <IbcInspecaoForm key={ibc.id} ibc={ibc} onClose={onClose} /> : null}</SheetContent>
    </Sheet>
  );
}

function IbcInspecaoForm({ ibc, onClose }: { ibc: IbcInspecionado; onClose: () => void }) {
  const vinculosState = useIbcChecklistVinculos(ibc.id);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [rascunhos, setRascunhos] = useState<Record<string, InspecaoItemRascunho>>({});
  const [observacao, setObservacao] = useState("");
  const checklistQuery = useIbcChecklistDetalhe(checklistId);
  const inspecao = useRegistrarIbcInspecao();

  const ativos = vinculosState.vinculos.filter((vinculo) => vinculo.ativo);
  const checklist = checklistQuery.data;
  const itens = checklist ? listItensInspecao(checklist) : [];
  const checklistSemMinimas =
    checklist != null && checklistInspecaoSemMinimasConfiguradas(checklist, itens);
  const payload =
    checklist && !checklistSemMinimas
      ? buildInspecaoPayload(checklist.id, itens, rascunhos, observacao)
      : null;
  const canSubmit = payload != null && !inspecao.isPending;
  const preenchidas = countItensInspecaoPreenchidos(itens, rascunhos);
  const exigeMinimas = checklistInspecaoExigeMinimas(itens);

  const patchRascunho = (itemId: string, patch: Partial<InspecaoItemRascunho>) => {
    setRascunhos((atual) => ({ ...atual, [itemId]: { ...atual[itemId], ...patch } }));
  };

  const handleSubmit = async () => {
    if (!payload || inspecao.isPending) return;
    if (await inspecao.registrar(ibc.id, payload)) onClose();
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Inspecionar {ibc.identificador}</SheetTitle>
        <SheetDescription>
          Responda cada item ativo: nota de 0 a 10 nos numéricos e Sim ou Não nos de sim/não.
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        {vinculosState.isLoading ? (
          <CadastroIbcSectionSkeleton rows={3} />
        ) : vinculosState.errorMessage ? (
          <CadastroIbcSectionError message={vinculosState.errorMessage} onRetry={vinculosState.retry} />
        ) : ativos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum checklist ativo vinculado a este IBC. Vincule um pela ação Checklists do container.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="ibc-inspecao-checklist" className="text-xs">
                Checklist
              </Label>
              <Select
                value={checklistId ?? ""}
                onValueChange={(id) => {
                  setChecklistId(id);
                  setRascunhos({});
                  setObservacao("");
                }}
                disabled={inspecao.isPending}
              >
                <SelectTrigger id="ibc-inspecao-checklist">
                  <SelectValue placeholder="Selecione o checklist" />
                </SelectTrigger>
                <SelectContent>
                  {ativos.map((vinculo) => (
                    <SelectItem key={vinculo.checklistModeloId} value={vinculo.checklistModeloId}>
                      {vinculo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {checklistId == null ? null : checklistQuery.isLoading ? (
              <CadastroIbcSectionSkeleton rows={4} />
            ) : checklistQuery.error ? (
              <CadastroIbcSectionError
                message={toError(checklistQuery.error).message}
                onRetry={() => void checklistQuery.refetch()}
              />
            ) : checklist ? (
              <>
                {checklistSemMinimas ? (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Este checklist tem item numérico ativo sem nota mínima e média mínima configuradas. Edite o
                    checklist em Gestão IBC antes de inspecionar.
                  </p>
                ) : exigeMinimas ? (
                  <p className="text-xs text-muted-foreground">
                    Aprova com todo item crítico ≥ {formatNotaInspecao(checklist.notaMinimaCritico)} e média dos
                    demais ≥ {formatNotaInspecao(checklist.mediaMinima)}; sim/não bloqueante deve bater com o
                    esperado.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sim/não bloqueante deve bater com a resposta esperada; os demais ficam registrados sem reprovar.
                  </p>
                )}
                {itens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Este checklist não tem itens ativos.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-md border">
                    {itens.map((item) => (
                      <InspecaoItemLinha
                        key={item.itemId}
                        item={item}
                        rascunho={rascunhos[item.itemId] ?? {}}
                        notaMinimaCritico={checklist.notaMinimaCritico}
                        disabled={inspecao.isPending || checklistSemMinimas}
                        onChange={(patch) => patchRascunho(item.itemId, patch)}
                      />
                    ))}
                  </ul>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="ibc-inspecao-observacao" className="text-xs">
                    Observação do checklist (opcional)
                  </Label>
                  <Textarea
                    id="ibc-inspecao-observacao"
                    value={observacao}
                    onChange={(event) => setObservacao(event.target.value)}
                    maxLength={IBC_OBSERVACAO_MAX}
                    rows={2}
                    disabled={inspecao.isPending}
                  />
                </div>
              </>
            ) : null}
          </div>
        )}
      </SheetBody>

      <SheetFooter className="sm:items-center sm:justify-between">
        <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {itens.length > 0 ? `${preenchidas} de ${itens.length} respostas` : null}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={inspecao.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {inspecao.isPending ? "Registrando…" : "Registrar inspeção"}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

type LinhaProps = {
  item: IbcChecklistItemNoChecklistDTO;
  rascunho: InspecaoItemRascunho;
  notaMinimaCritico: number | null;
  disabled: boolean;
  onChange: (patch: Partial<InspecaoItemRascunho>) => void;
};

function InspecaoItemLinha({ item, rascunho, notaMinimaCritico, disabled, onChange }: LinhaProps) {
  const setResposta = (resposta: IbcChecklistItemRespostaEsperada) => onChange({ resposta });

  return (
    <li className="space-y-2 px-3 py-3">
      <InspecaoItemLabel item={item} notaMinimaCritico={notaMinimaCritico} />
      {item.tipo === "NUMERICO" ? (
        <Input
          id={`ibc-inspecao-nota-${item.itemId}`}
          type="number"
          inputMode="numeric"
          min={0}
          max={10}
          step={1}
          className="w-20 text-right tabular-nums"
          value={rascunho.nota ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ nota: event.target.value })}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(["SIM", "NAO"] as const).map((valor) => (
              <Button
                key={valor}
                type="button"
                size="sm"
                variant={rascunho.resposta === valor ? "default" : "outline"}
                disabled={disabled}
                onClick={() => setResposta(valor)}
              >
                {labelRespostaSimNao(valor)}
              </Button>
            ))}
          </div>
          <Textarea
            id={`ibc-inspecao-item-obs-${item.itemId}`}
            placeholder="Observação do item (opcional)"
            value={rascunho.observacaoItem ?? ""}
            onChange={(event) => onChange({ observacaoItem: event.target.value })}
            maxLength={IBC_OBSERVACAO_MAX}
            rows={2}
            disabled={disabled}
            className="text-sm"
          />
        </div>
      )}
    </li>
  );
}

function InspecaoItemLabel({
  item,
  notaMinimaCritico,
}: {
  item: IbcChecklistItemNoChecklistDTO;
  notaMinimaCritico: number | null;
}) {
  return (
    <Label
      htmlFor={
        item.tipo === "NUMERICO" ? `ibc-inspecao-nota-${item.itemId}` : `ibc-inspecao-item-obs-${item.itemId}`
      }
      className="flex min-w-0 flex-col gap-0.5 text-sm font-normal"
    >
      <span className="break-words">{item.descricao}</span>
      {item.tipo === "NUMERICO" && item.critico ? (
        <span className="text-xs font-medium text-muted-foreground">
          Crítico · mín. {formatNotaInspecao(notaMinimaCritico)}
        </span>
      ) : item.tipo === "SIM_NAO" ? (
        <span className="text-xs font-medium text-muted-foreground">
          Esperado: {item.respostaEsperada ? labelRespostaSimNao(item.respostaEsperada) : "—"} · Bloqueante:{" "}
          {labelBloqueanteSimNao(item.bloqueante)}
        </span>
      ) : null}
    </Label>
  );
}