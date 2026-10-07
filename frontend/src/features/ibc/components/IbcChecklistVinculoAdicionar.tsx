import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { IbcChecklistSummaryDTO } from "../types/ibcChecklist.types";

type Props = {
  disponiveis: IbcChecklistSummaryDTO[];
  hasChecklistAtivo: boolean;
  submitting: boolean;
  onVincular: (checklistModeloId: string) => Promise<boolean>;
};

const SELECT_ID = "ibc-checklist-vinculo-select";

export default function IbcChecklistVinculoAdicionar({
  disponiveis,
  hasChecklistAtivo,
  submitting,
  onVincular,
}: Props) {
  const [selecionado, setSelecionado] = useState("");

  if (!hasChecklistAtivo || disponiveis.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {hasChecklistAtivo ? (
          "Todos os checklists ativos já estão vinculados."
        ) : (
          <>
            Nenhum checklist de IBC ativo.{" "}
            <Link to="/checklists-ibc" className="font-medium text-primary underline-offset-4 hover:underline">
              Cadastre um checklist
            </Link>{" "}
            para vincular.
          </>
        )}
      </p>
    );
  }

  const valorAtual = disponiveis.some((c) => c.id === selecionado) ? selecionado : "";

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={async (event) => {
        event.preventDefault();
        if (valorAtual && (await onVincular(valorAtual))) setSelecionado("");
      }}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor={SELECT_ID} className="text-xs">
          Adicionar checklist
        </Label>
        <Select value={valorAtual} onValueChange={setSelecionado} disabled={submitting}>
          <SelectTrigger id={SELECT_ID}>
            <SelectValue placeholder="Selecione um checklist" />
          </SelectTrigger>
          <SelectContent>
            {disponiveis.map((checklist) => (
              <SelectItem key={checklist.id} value={checklist.id}>
                {checklist.nome} · {checklist.totalItens}{" "}
                {checklist.totalItens === 1 ? "item" : "itens"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={!valorAtual || submitting}>
        {submitting ? "Vinculando…" : "Vincular"}
      </Button>
    </form>
  );
}
