import { useState, type FormEvent, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CreateIbcChecklistItemInput,
  IbcChecklistItemDTO,
  UpdateIbcChecklistItemInput,
} from "../types/ibcChecklist.types";

type Props = {
  editing: IbcChecklistItemDTO | null;
  saving: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onCreate: (input: CreateIbcChecklistItemInput) => Promise<unknown>;
  onUpdate: (id: string, input: UpdateIbcChecklistItemInput) => Promise<unknown>;
  onCancelEdit: () => void;
};

export default function IbcChecklistItemForm({
  editing,
  saving,
  inputRef,
  onCreate,
  onUpdate,
  onCancelEdit,
}: Props) {
  const [descricao, setDescricao] = useState(editing?.descricao ?? "");
  const [critico, setCritico] = useState(editing?.critico ?? false);
  const canSubmit = descricao.trim().length > 0 && !saving;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const input = { descricao: descricao.trim(), critico };
    try {
      await (editing ? onUpdate(editing.id, input) : onCreate(input));
      setDescricao("");
      setCritico(false);
      onCancelEdit();
    } catch {
      // Erro de API: toast no hook; mantém o formulário preenchido.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor="ibc-item-descricao" className="text-xs">
          Descrição do item
        </Label>
        <Input
          id="ibc-item-descricao"
          ref={inputRef}
          value={descricao}
          maxLength={200}
          placeholder="Ex.: Tampa sem trincas"
          onChange={(event) => setDescricao(event.target.value)}
          disabled={saving}
        />
      </div>
      <div className="flex items-center gap-2 sm:pb-2.5">
        <Checkbox
          id="ibc-item-critico"
          checked={critico}
          onCheckedChange={(checked) => setCritico(checked === true)}
          disabled={saving}
        />
        <Label htmlFor="ibc-item-critico" className="text-sm">
          Crítico
        </Label>
      </div>
      <Button type="submit" disabled={!canSubmit}>
        {editing ? "Salvar edição" : "Cadastrar item"}
      </Button>
      {editing ? (
        <Button type="button" variant="outline" onClick={onCancelEdit} disabled={saving}>
          Cancelar
        </Button>
      ) : null}
    </form>
  );
}
