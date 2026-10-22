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
import { buildInspecaoPayload, formatNotaInspecao, listItensInspecao } from "../utils/ibcInspecao.utils";
import { IBC_OBSERVACAO_MAX } from "../utils/ibcMudanca.utils";
import { toError } from "../utils/toError";
import CadastroIbcSectionError from "./CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "./CadastroIbcSectionSkeleton";

type Props = {
  ibc: Pick<IbcCadastroDTO, "id" | "identificador">;
  onClose: () => void;
};

export default function IbcInspecaoDrawer({ ibc, onClose }: Props) {
  const vinculosState = useIbcChecklistVinculos(ibc.id);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [observacao, setObservacao] = useState("");
  const checklistQuery = useIbcChecklistDetalhe(checklistId);
  const inspecao = useRegistrarIbcInspecao();

  const ativos = vinculosState.vinculos.filter((vinculo) => vinculo.ativo);
  const checklist = checklistQuery.data;
  const itens = checklist ? listItensInspecao(checklist) : [];
  const payload = checklist ? buildInspecaoPayload(checklist.id, itens, notas, observacao) : null;
  const canSubmit = payload != null && !inspecao.isPending;
  const preenchidas = itens.filter((item) => (notas[item.itemId] ?? "").trim() !== "").length;

  const handleSubmit = async () => {
    if (!payload || inspecao.isPending) return;
    if (await inspecao.registrar(ibc.id, payload)) onClose();
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Inspecionar {ibc.identificador}</SheetTitle>
          <SheetDescription>Dê uma nota inteira de 0 a 10 para cada item ativo do checklist.</SheetDescription>
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
                <CadastroIbcSectionSkeleton rows={4} />
              ) : checklistQuery.error ? (
                <CadastroIbcSectionError
                  message={toError(checklistQuery.error).message}
                  onRetry={() => void checklistQuery.refetch()}
                />
              ) : checklist ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Aprova com todo item crítico ≥ {formatNotaInspecao(checklist.notaMinimaCritico)} e média dos
                    demais ≥ {formatNotaInspecao(checklist.mediaMinima)}.
                  </p>
                  {itens.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Este checklist não tem itens ativos.</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-md border">
                      {itens.map((item) => (
                        <li key={item.itemId} className="flex items-center justify-between gap-3 px-3 py-2">
                          <Label
                            htmlFor={`ibc-inspecao-nota-${item.itemId}`}
                            className="flex min-w-0 flex-col gap-0.5 text-sm font-normal"
                          >
                            <span className="break-words">{item.descricao}</span>
                            {item.critico ? (
                              <span className="text-xs font-medium text-muted-foreground">
                                Crítico · mín. {formatNotaInspecao(checklist.notaMinimaCritico)}
                              </span>
                            ) : null}
                          </Label>
                          <Input
                            id={`ibc-inspecao-nota-${item.itemId}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={10}
                            step={1}
                            className="w-20 shrink-0 text-right tabular-nums"
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
                    <Label htmlFor="ibc-inspecao-observacao" className="text-xs">
                      Observação (opcional)
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
            {itens.length > 0 ? `${preenchidas} de ${itens.length} notas` : null}
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
      </SheetContent>
    </Sheet>
  );
}
