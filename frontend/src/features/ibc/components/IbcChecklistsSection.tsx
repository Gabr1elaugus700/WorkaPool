import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  CreateIbcChecklistInput,
  IbcChecklistDTO,
  IbcChecklistItemDTO,
  IbcChecklistSummaryDTO,
  UpdateIbcChecklistInput,
} from "../types/ibcChecklist.types";
import type { IbcChecklistForm as FormState } from "../utils/ibcChecklist.utils";
import IbcChecklistForm from "./IbcChecklistForm";

type Props = {
  checklists: IbcChecklistSummaryDTO[];
  catalogo: IbcChecklistItemDTO[];
  saving: boolean;
  onLoad: (id: string) => Promise<IbcChecklistDTO>;
  onCreate: (input: CreateIbcChecklistInput) => Promise<unknown>;
  onUpdate: (id: string, input: UpdateIbcChecklistInput) => Promise<unknown>;
};

const NOVO: FormState = { nome: "", notaMinimaCritico: "", mediaMinima: "", itensIds: [] };
const formatNota = (nota: number | null) => (nota === null ? "—" : nota.toLocaleString("pt-BR"));
const notaToInput = (nota: number | null) => (nota === null ? "" : String(nota).replace(".", ","));

export default function IbcChecklistsSection({ checklists, catalogo, saving, onLoad, onCreate, onUpdate }: Props) {
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);

  const editar = async (id: string) => {
    const checklist = await onLoad(id).catch(() => null);
    if (!checklist) return;
    setEditing({
      id,
      form: {
        nome: checklist.nome,
        notaMinimaCritico: notaToInput(checklist.notaMinimaCritico),
        mediaMinima: notaToInput(checklist.mediaMinima),
        itensIds: [...checklist.itens].sort((a, b) => a.ordem - b.ordem).map((item) => item.itemId),
      },
    });
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <IbcChecklistForm
          key={editing.id ?? "novo"}
          initial={editing.form}
          catalogo={catalogo}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSubmit={async (payload) => {
            await (editing.id ? onUpdate(editing.id, payload) : onCreate(payload));
            setEditing(null);
          }}
        />
      ) : (
        <Button type="button" onClick={() => setEditing({ id: null, form: NOVO })}>
          Novo checklist
        </Button>
      )}

      {checklists.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum checklist cadastrado.</p>
      ) : (
        <ul className="divide-y divide-border">
          {checklists.map((checklist) => (
            <li key={checklist.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{checklist.nome}</span>
                {!checklist.ativo ? <Badge variant="outline" className="text-[10px]">Inativo</Badge> : null}
                <span className="text-muted-foreground">
                  {checklist.totalItens} itens · crítico ≥ {formatNota(checklist.notaMinimaCritico)} · média ≥{" "}
                  {formatNota(checklist.mediaMinima)}
                </span>
              </div>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => void editar(checklist.id)}>
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => void onUpdate(checklist.id, { ativo: !checklist.ativo }).catch(() => undefined)}
                >
                  {checklist.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
