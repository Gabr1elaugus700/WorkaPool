import { useState, type FormEvent, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  CreateIbcChecklistItemInput,
  IbcChecklistItemDTO,
  IbcChecklistItemRespostaEsperada,
  IbcChecklistItemTipo,
  UpdateIbcChecklistItemInput,
} from "../types/ibcChecklist.types";
import {
  applyItemFormTipoChange,
  buildItemPayload,
  canSubmitItemForm,
  initialItemFormState,
  resetItemFormAfterSuccess,
  type IbcChecklistItemFormState,
} from "../utils/ibcChecklistItemForm.utils";

type Props = {
  editing: IbcChecklistItemDTO | null;
  saving: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onCreate: (input: CreateIbcChecklistItemInput) => Promise<unknown>;
  onUpdate: (id: string, input: UpdateIbcChecklistItemInput) => Promise<unknown>;
  onCancelEdit: () => void;
};

const TIPO_OPTIONS: { value: IbcChecklistItemTipo; label: string }[] = [
  { value: "NUMERICO", label: "Numérico" },
  { value: "SIM_NAO", label: "Sim/não" },
];

const BLOQUEANTE_PLACEHOLDER = "selecione-bloqueante";
const RESPOSTA_PLACEHOLDER = "selecione-resposta";

export default function IbcChecklistItemForm({
  editing,
  saving,
  inputRef,
  onCreate,
  onUpdate,
  onCancelEdit,
}: Props) {
  const [form, setForm] = useState<IbcChecklistItemFormState>(() => initialItemFormState(editing));
  const canSubmit = canSubmitItemForm(form) && !saving;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const payload = buildItemPayload(form, {
      isEdit: Boolean(editing),
      originalTipo: editing?.tipo,
    });
    try {
      if (editing) {
        await onUpdate(editing.id, payload as UpdateIbcChecklistItemInput);
      } else {
        await onCreate(payload as CreateIbcChecklistItemInput);
      }
      setForm(resetItemFormAfterSuccess());
      onCancelEdit();
    } catch {
      // Erro de API: toast no hook; mantém o formulário preenchido.
    }
  };

  const setTipo = (tipo: IbcChecklistItemTipo) => {
    setForm((current) => applyItemFormTipoChange(current, tipo));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0 space-y-1.5 sm:col-span-2">
          <Label htmlFor="ibc-item-descricao" className="text-xs">
            Descrição do item
          </Label>
          <Input
            id="ibc-item-descricao"
            ref={inputRef}
            value={form.descricao}
            maxLength={200}
            placeholder="Ex.: Tampa sem trincas"
            onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
            disabled={saving}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ibc-item-tipo" className="text-xs">
            Tipo
          </Label>
          <Select
            value={form.tipo}
            onValueChange={(value) => setTipo(value as IbcChecklistItemTipo)}
            disabled={saving}
          >
            <SelectTrigger id="ibc-item-tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.tipo === "NUMERICO" ? (
          <div className="flex items-center gap-2 sm:pb-2.5">
            <Checkbox
              id="ibc-item-critico"
              checked={form.critico}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, critico: checked === true }))
              }
              disabled={saving}
            />
            <Label htmlFor="ibc-item-critico" className="text-sm">
              Crítico
            </Label>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="ibc-item-resposta" className="text-xs">
                Resposta esperada
              </Label>
              <Select
                value={form.respostaEsperada ?? RESPOSTA_PLACEHOLDER}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    respostaEsperada: value as IbcChecklistItemRespostaEsperada,
                  }))
                }
                disabled={saving}
              >
                <SelectTrigger id="ibc-item-resposta">
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RESPOSTA_PLACEHOLDER} disabled>
                    Selecione…
                  </SelectItem>
                  <SelectItem value="SIM">Sim</SelectItem>
                  <SelectItem value="NAO">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ibc-item-bloqueante" className="text-xs">
                Bloqueante
              </Label>
              <Select
                value={
                  form.bloqueante === undefined
                    ? BLOQUEANTE_PLACEHOLDER
                    : form.bloqueante
                      ? "true"
                      : "false"
                }
                onValueChange={(value) => {
                  if (value === BLOQUEANTE_PLACEHOLDER) return;
                  setForm((current) => ({
                    ...current,
                    bloqueante: value === "true",
                  }));
                }}
                disabled={saving}
              >
                <SelectTrigger id="ibc-item-bloqueante">
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BLOQUEANTE_PLACEHOLDER} disabled>
                    Selecione…
                  </SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {editing ? "Salvar edição" : "Cadastrar item"}
        </Button>
        {editing ? (
          <Button type="button" variant="outline" onClick={onCancelEdit} disabled={saving}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}