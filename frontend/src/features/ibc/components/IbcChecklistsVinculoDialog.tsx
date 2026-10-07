import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatIsoDateTimeLabel } from "@/utils/formatDate";
import type { IbcChecklistVinculosState } from "../hooks/useIbcChecklistVinculos";
import { listChecklistsDisponiveisParaVinculo } from "../utils/ibcChecklist.utils";
import CadastroIbcSectionError from "./CadastroIbcSectionError";
import CadastroIbcSectionSkeleton from "./CadastroIbcSectionSkeleton";
import IbcChecklistVinculoAdicionar from "./IbcChecklistVinculoAdicionar";

type Props = {
  identificador: string;
  state: IbcChecklistVinculosState;
  onClose: () => void;
};

export default function IbcChecklistsVinculoDialog({ identificador, state, onClose }: Props) {
  const { vinculos, checklists, pendingChecklistId } = state;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Checklists de {identificador}</DialogTitle>
          <DialogDescription>
            Vincular ou desvincular não altera a aptidão do IBC.
          </DialogDescription>
        </DialogHeader>

        {state.isLoading ? (
          <CadastroIbcSectionSkeleton rows={2} />
        ) : state.errorMessage ? (
          <CadastroIbcSectionError message={state.errorMessage} onRetry={state.retry} />
        ) : (
          <div className="space-y-5">
            <IbcChecklistVinculoAdicionar
              disponiveis={listChecklistsDisponiveisParaVinculo(checklists, vinculos)}
              hasChecklistAtivo={checklists.some((checklist) => checklist.ativo)}
              submitting={state.isVinculando}
              onVincular={state.vincular}
            />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Vinculados ({vinculos.length})</h3>
              {vinculos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum checklist vinculado a este IBC.
                </p>
              ) : (
                <ul className="max-h-80 divide-y divide-border overflow-auto rounded-md border">
                  {vinculos.map((vinculo) => {
                    const pending = pendingChecklistId === vinculo.checklistModeloId;
                    return (
                      <li
                        key={vinculo.checklistModeloId}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            <span className="break-words">{vinculo.nome}</span>
                            {vinculo.ativo ? null : (
                              <Badge variant="outline" className="text-[10px]">
                                Inativo
                              </Badge>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatIsoDateTimeLabel(vinculo.vinculadoEm)} · {vinculo.vinculadoPor.nome}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          aria-label={`Desvincular ${vinculo.nome}`}
                          disabled={pending}
                          onClick={() => void state.desvincular(vinculo.checklistModeloId)}
                        >
                          {pending ? "Desvinculando…" : "Desvincular"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
