import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIsoDateTimeLabel } from "@/utils/formatDate";
import type { IbcChecklistSummaryDTO, IbcChecklistVinculoDTO } from "../types/ibcChecklist.types";
import { listChecklistsDisponiveisParaVinculo } from "../utils/ibcChecklist.utils";
import IbcChecklistVinculoAdicionar from "./IbcChecklistVinculoAdicionar";

type Props = {
  canWrite: boolean;
  vinculos: IbcChecklistVinculoDTO[];
  checklists: IbcChecklistSummaryDTO[];
  submitting: boolean;
  pendingChecklistId: string | null;
  onVincular: (checklistModeloId: string) => Promise<boolean>;
  onDesvincular: (checklistModeloId: string) => Promise<boolean>;
};

export default function CadastroIbcChecklists({
  canWrite,
  vinculos,
  checklists,
  submitting,
  pendingChecklistId,
  onVincular,
  onDesvincular,
}: Props) {
  return (
    <section className="mt-6 space-y-3 border-t pt-4" aria-labelledby="ibc-detalhe-checklists">
      <h3 id="ibc-detalhe-checklists" className="text-sm font-semibold text-foreground">
        Checklists
      </h3>
      {canWrite ? (
        <IbcChecklistVinculoAdicionar
          disponiveis={listChecklistsDisponiveisParaVinculo(checklists, vinculos)}
          hasChecklistAtivo={checklists.some((checklist) => checklist.ativo)}
          submitting={submitting}
          onVincular={onVincular}
        />
      ) : null}
      {vinculos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum checklist vinculado</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border">
          {vinculos.map((vinculo) => {
            const pending = pendingChecklistId === vinculo.checklistModeloId;
            return (
              <li key={vinculo.checklistModeloId} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="break-words">{vinculo.nome}</span>
                    {vinculo.ativo ? null : <Badge variant="outline">Inativo</Badge>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatIsoDateTimeLabel(vinculo.vinculadoEm)} · {vinculo.vinculadoPor.nome}
                  </p>
                </div>
                {canWrite ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Desvincular ${vinculo.nome}`}
                    disabled={pending}
                    onClick={() => void onDesvincular(vinculo.checklistModeloId)}
                  >
                    {pending ? "Desvinculando…" : "Desvincular"}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
