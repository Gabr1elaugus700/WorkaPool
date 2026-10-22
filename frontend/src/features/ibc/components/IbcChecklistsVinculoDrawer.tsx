import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

export default function IbcChecklistsVinculoDrawer({ identificador, state, onClose }: Props) {
  const { vinculos, checklists, pendingChecklistId } = state;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Checklists de {identificador}</SheetTitle>
          <SheetDescription>Vincular ou desvincular não altera a aptidão do IBC.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {state.isLoading ? (
            <CadastroIbcSectionSkeleton rows={3} />
          ) : state.errorMessage ? (
            <CadastroIbcSectionError message={state.errorMessage} onRetry={state.retry} />
          ) : (
            <div className="space-y-6">
              <IbcChecklistVinculoAdicionar
                disponiveis={listChecklistsDisponiveisParaVinculo(checklists, vinculos)}
                hasChecklistAtivo={checklists.some((checklist) => checklist.ativo)}
                submitting={state.isVinculando}
                onVincular={state.vincular}
              />

              <section className="space-y-2" aria-labelledby="ibc-vinculados-titulo">
                <h3 id="ibc-vinculados-titulo" className="text-sm font-semibold text-foreground">
                  Vinculados{" "}
                  <span className="font-normal tabular-nums text-muted-foreground">({vinculos.length})</span>
                </h3>
                {vinculos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum checklist vinculado a este IBC.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-md border">
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
                              {vinculo.ativo ? null : <Badge variant="outline">Inativo</Badge>}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatIsoDateTimeLabel(vinculo.vinculadoEm)} · {vinculo.vinculadoPor.nome}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
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
              </section>
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
