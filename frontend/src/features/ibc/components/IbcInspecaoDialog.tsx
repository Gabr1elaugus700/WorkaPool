import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIbcChecklistVinculos } from "../hooks/useIbcChecklistVinculos";
import { useIbcInspecao, useIbcInspecaoChecklist } from "../hooks/useIbcInspecao";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import { buildInspecaoPayload, formatNotaInspecao, listItensInspecao } from "../utils/ibcInspecao.utils";
import { IBC_OBSERVACAO_MAX } from "../utils/ibcMudanca.utils";
import { toError } from "../utils/toError";
import CadastroIbcSectionError from "./CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "./CadastroIbcSectionSkeleton";

type Props = {
  ibc: IbcCadastroDTO;
  onClose: () => void;
};

export default function IbcInspecaoDialog({ ibc, onClose }: Props) {
  const vinculosState = useIbcChecklistVinculos(ibc.id);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [observacao, setObservacao] = useState("");
  const checklistQuery = useIbcInspecaoChecklist(checklistId);
  const inspecao = useIbcInspecao();

  const ativos = vinculosState.vinculos.filter((vinculo) => vinculo.ativo);
  const checklist = checklistQuery.data;
  const itens = checklist ? listItensInspecao(checklist) : [];
  const payload = checklist ? buildInspecaoPayload(checklist.id, itens, notas, observacao) : null;
  const canSubmit = payload != null && !inspecao.isPending;

  const handleSubmit = async () => {
    if (!payload || inspecao.isPending) return;
    if (await inspecao.registrar(ibc.id, payload)) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inspecionar {ibc.identificador}</DialogTitle>
          <DialogDescription>
            Dê uma nota inteira de 0 a 10 para cada item ativo do checklist.
          </DialogDescription>
        </DialogHeader>

        {vinculosState.isLoading ? (
          <CadastroIbcSectionSkeleton rows={2} />
        ) : vinculosState.errorMessage ? (
          <CadastroIbcSectionError message={vinculosState.errorMessage} onRetry={vinculosState.retry} />
        ) : ativos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum checklist ativo vinculado a este IBC. Vincule um em "Checklists".
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ibc-inspecao-checklist" className="text-xs">Checklist</Label>
              <Select
                value={checklistId ?? ""}
                onValueChange={(id) => {
                  setChecklistId(id);
                  setNotas({});
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
              <CadastroIbcSectionSkeleton rows={3} />
            ) : checklistQuery.error ? (
              <CadastroIbcSectionError
                message={toError(checklistQuery.error).message}
                onRetry={() => void checklistQuery.refetch()}
              />
            ) : checklist ? (
              <>
                <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  Aprova com todo item crítico ≥ {formatNotaInspecao(checklist.notaMinimaCritico)} e
                  média dos demais ≥ {formatNotaInspecao(checklist.mediaMinima)}.
                </p>
                {itens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Este checklist não tem itens ativos.</p>
                ) : (
                  <ul className="max-h-72 divide-y divide-border overflow-auto rounded-md border">
                    {itens.map((item) => (
                      <li key={item.itemId} className="flex items-center justify-between gap-3 px-3 py-2">
                        <Label
                          htmlFor={`ibc-inspecao-nota-${item.itemId}`}
                          className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-normal"
                        >
                          <span className="break-words">{item.descricao}</span>
                          {item.critico ? (
                            <Badge variant="outline" className="text-[10px]">
                              Crítico · mín. {formatNotaInspecao(checklist.notaMinimaCritico)}
                            </Badge>
                          ) : null}
                        </Label>
                        <Input
                          id={`ibc-inspecao-nota-${item.itemId}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={10}
                          step={1}
                          className="w-20 shrink-0"
                          value={notas[item.itemId] ?? ""}
                          disabled={inspecao.isPending}
                          onChange={(event) =>
                            setNotas((atual) => ({ ...atual, [item.itemId]: event.target.value }))
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="ibc-inspecao-observacao" className="text-xs">Observação (opcional)</Label>
                  <textarea
                    id="ibc-inspecao-observacao"
                    value={observacao}
                    onChange={(event) => setObservacao(event.target.value)}
                    maxLength={IBC_OBSERVACAO_MAX}
                    rows={2}
                    disabled={inspecao.isPending}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={inspecao.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {inspecao.isPending ? "Registrando…" : "Registrar inspeção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
