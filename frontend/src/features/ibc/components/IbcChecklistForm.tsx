import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateIbcChecklistInput, IbcChecklistItemDTO } from "../types/ibcChecklist.types";
import {
  buildChecklistPayload,
  listItensDisponiveis,
  moveItem,
  type IbcChecklistForm as FormState,
} from "../utils/ibcChecklist.utils";

type Props = {
  initial: FormState;
  catalogo: IbcChecklistItemDTO[];
  saving: boolean;
  onSubmit: (payload: CreateIbcChecklistInput) => Promise<unknown>;
  onCancel: () => void;
};

const NOTAS = [
  { key: "notaMinimaCritico", label: "Nota mínima do item crítico (0-10)" },
  { key: "mediaMinima", label: "Média mínima (0-10)" },
] as const;

export default function IbcChecklistForm({ initial, catalogo, saving, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [itemParaAdicionar, setItemParaAdicionar] = useState("");
  const payload = buildChecklistPayload(form);
  const disponiveis = listItensDisponiveis(catalogo, form.itensIds);
  const porId = new Map(catalogo.map((item) => [item.id, item]));
  const setItens = (itensIds: string[]) => setForm((atual) => ({ ...atual, itensIds }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!payload || saving) return;
    await onSubmit(payload).catch(() => undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ibc-checklist-nome" className="text-xs">Nome</Label>
          <Input
            id="ibc-checklist-nome"
            value={form.nome}
            maxLength={120}
            placeholder="Ex.: Checklist Soda"
            onChange={(event) => setForm({ ...form, nome: event.target.value })}
          />
        </div>
        {NOTAS.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`ibc-checklist-${key}`} className="text-xs">{label}</Label>
            <Input
              id={`ibc-checklist-${key}`}
              inputMode="decimal"
              value={form[key]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="ibc-checklist-item" className="text-xs">Adicionar item ativo</Label>
          <Select value={itemParaAdicionar} onValueChange={setItemParaAdicionar}>
            <SelectTrigger id="ibc-checklist-item">
              <SelectValue placeholder={disponiveis.length ? "Selecione um item" : "Nenhum item disponível"} />
            </SelectTrigger>
            <SelectContent>
              {disponiveis.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.descricao}{item.critico ? " (crítico)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={!itemParaAdicionar}
          onClick={() => {
            setItens([...form.itensIds, itemParaAdicionar]);
            setItemParaAdicionar("");
          }}
        >
          Adicionar
        </Button>
      </div>

      <ol className="space-y-1">
        {form.itensIds.map((id, index) => (
          <li key={id} className="flex items-center gap-2 rounded border px-2 py-1 text-sm">
            <span className="w-5 text-muted-foreground">{index + 1}.</span>
            <span className="flex-1">{porId.get(id)?.descricao ?? id}</span>
            {porId.get(id)?.critico ? <Badge variant="destructive" className="text-[10px]">Crítico</Badge> : null}
            {porId.get(id)?.ativo === false ? <Badge variant="outline" className="text-[10px]">Inativo</Badge> : null}
            <Button type="button" variant="ghost" size="icon" aria-label="Subir" disabled={index === 0} onClick={() => setItens(moveItem(form.itensIds, index, "up"))}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Descer" disabled={index === form.itensIds.length - 1} onClick={() => setItens(moveItem(form.itensIds, index, "down"))}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Remover" onClick={() => setItens(form.itensIds.filter((itemId) => itemId !== id))}>
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ol>

      <div className="flex gap-2">
        <Button type="submit" disabled={!payload || saving}>Salvar checklist</Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
      </div>
    </form>
  );
}
