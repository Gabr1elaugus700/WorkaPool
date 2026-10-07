import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
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
  itens: IbcChecklistItemDTO[];
  saving: boolean;
  onCreate: (input: CreateIbcChecklistItemInput) => Promise<unknown>;
  onUpdate: (id: string, input: UpdateIbcChecklistItemInput) => Promise<unknown>;
};

export default function IbcChecklistItensSection({ itens, saving, onCreate, onUpdate }: Props) {
  const [descricao, setDescricao] = useState("");
  const [critico, setCritico] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const canSubmit = descricao.trim().length > 0 && !saving;

  const resetForm = () => {
    setDescricao("");
    setCritico(false);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const input = { descricao: descricao.trim(), critico };
    try {
      await (editingId ? onUpdate(editingId, input) : onCreate(input));
      resetForm();
    } catch {
      // Erro de API: toast no hook; mantém o formulário preenchido.
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="ibc-item-descricao" className="text-xs">
            Descrição do item
          </Label>
          <Input
            id="ibc-item-descricao"
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
          {editingId ? "Salvar edição" : "Cadastrar item"}
        </Button>
        {editingId ? (
          <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
            Cancelar
          </Button>
        ) : null}
      </form>

      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item cadastrado.</p>
      ) : (
        <ul className="divide-y divide-border">
          {itens.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className={item.ativo ? "text-sm" : "text-sm text-muted-foreground line-through"}>
                  {item.descricao}
                </span>
                {item.critico ? (
                  <Badge variant="destructive" className="text-[10px]">Crítico</Badge>
                ) : null}
                {!item.ativo ? (
                  <Badge variant="outline" className="text-[10px]">Inativo</Badge>
                ) : null}
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => {
                    setEditingId(item.id);
                    setDescricao(item.descricao);
                    setCritico(item.critico);
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => void onUpdate(item.id, { ativo: !item.ativo }).catch(() => undefined)}
                >
                  {item.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
